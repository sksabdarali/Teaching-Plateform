const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Simple hash function for rate limiting
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Robust JSON extraction for free-tier responses - PROBLEM 5 FIX
const extractJsonFromResponse = (responseText) => {
  try {
    if (!responseText || typeof responseText !== 'string') {
      throw new Error('Invalid response text provided');
    }

    // Look for JSON within code blocks first (most common in free-tier responses) - PROBLEM 5 FIX
    // More robust pattern to handle various markdown code block formats
    const codeBlockMatch = responseText.match(/```(?:json|javascript)?\s*\n?([\s\S]*?)\s*```/i);
    let jsonString = codeBlockMatch ? codeBlockMatch[1].trim() : responseText.trim();

    // If no code block, look for JSON between curly braces/brackets
    if (!jsonString.startsWith('{') && !jsonString.startsWith('[')) {
      const jsonMatch = responseText.match(/\{[\s\S]*?\}|\[[\s\S]*?\]/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }
    }

    if (!jsonString) {
      throw new Error('No JSON found in response');
    }

    // Try to parse the JSON
    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      // Try to fix common JSON issues with free-tier responses - PROBLEM 5 FIX
      try {
        // Remove common markdown artifacts - MORE ROBUST VERSION
        // Remove start of code block (```json, ```javascript, ``` etc)
        jsonString = jsonString.replace(/^```[a-z]*\s*\n?/gi, '');
        // Remove end of code block (```)
        jsonString = jsonString.replace(/```\s*$/gi, '');
        // Remove any remaining backticks at the start or end
        jsonString = jsonString.replace(/^`+|`+$/g, '');
        // Trim again
        jsonString = jsonString.trim();

        // Remove trailing commas before closing braces/brackets
        jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
        // Remove trailing commas in arrays/objects
        jsonString = jsonString.replace(/,\s*(?=\s*[}\]])/g, '');

        // Fix common free-tier JSON formatting issues
        jsonString = jsonString.replace(/,\s*\n\s*[}\]]/g, match => match.trim());

        // Remove any remaining markdown or text artifacts
        jsonString = jsonString.replace(/^.*?\{/, '{'); // Remove text before first {
        jsonString = jsonString.replace(/\}[^}]*$/, '}'); // Remove text after last }

        parsedData = JSON.parse(jsonString);
      } catch (fixError) {
        console.error('Failed to parse and fix JSON:', fixError.message);
        console.error('JsonString attempted:', jsonString.substring(0, 500) + '...');
        console.error('Response text (first 500 chars):', responseText.substring(0, 500) + '...');
        throw new Error(`Could not parse JSON: ${parseError.message}`);
      }
    }

    return parsedData;
  } catch (error) {
    console.error('Error parsing JSON from Gemini response:', error);
    console.error('Response text (first 500 chars):', responseText.substring(0, 500) + '...');
    throw new Error('Invalid JSON response from Gemini API: ' + error.message);
  }
};

const generateContent = async (prompt, options = {}) => {
  // Try models in order: newest first, with fallbacks
  const models = options.model
    ? [options.model]
    : [
      "gemini-3-pro-preview",       // Gemini 3 Pro — best quality
      "gemini-2.5-pro",             // Gemini 2.5 Pro — unlimited TPM
      "gemini-3-flash-preview",     // Gemini 3 Flash — fast + capable
      "gemini-2.5-flash",           // Gemini 2.5 Flash — reliable workhorse
      "gemini-2.5-flash-lite",      // Gemini 2.5 Flash Lite — lightweight
      "gemini-2.0-flash",           // Gemini 2.0 Flash — stable fallback
      "gemini-2.0-flash-lite",      // Gemini 2.0 Flash Lite — lightweight fallback
      "gemma-3-27b-it",             // Gemma 3 27B — largest open model
      "gemma-3-12b-it",             // Gemma 3 12B
      "gemma-3-4b-it",              // Gemma 3 4B
      "gemma-3-2b-it",              // Gemma 3 2B
      "gemma-3-1b-it",              // Gemma 3 1B — smallest fallback
    ];

  let lastError;
  for (const modelName of models) {
    try {
      console.log(`Trying Gemini model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log(`✅ Gemini model ${modelName} succeeded`);
      return text;
    } catch (error) {
      console.error(`❌ Gemini model ${modelName} failed:`, error.message);
      lastError = error;
    }
  }

  console.error('All Gemini models failed');
  throw lastError;
};

module.exports = {
  generateContent,
  extractJsonFromResponse
};