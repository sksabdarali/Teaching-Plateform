const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai"); // We'll use this for OpenAI fallback
require('dotenv').config();

// Initialize AI providers
const providers = {};

// Initialize Gemini if API key is available
if (process.env.GEMINI_API_KEY) {
  providers.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Initialize OpenAI if API key is available
if (process.env.OPENAI_API_KEY) {
  providers.openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

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

// Queue system to handle one request at a time
const requestQueue = [];
let isProcessing = false;

// Process next request in queue
const processNextRequest = async () => {
  if (requestQueue.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const { prompt, options, resolve, reject } = requestQueue.shift();

  try {
    const result = await processAIRequest(prompt, options);
    resolve(result);
  } catch (error) {
    reject(error);
  }

  // Process next request after a small delay to respect API limits
  setTimeout(() => {
    processNextRequest();
  }, 1000); // 1 second delay between requests
};

// Internal function to process AI request
const processAIRequest = async (prompt, options = {}) => {
  const availableProviders = [];

  // Add providers based on availability and priority
  if (providers.gemini) availableProviders.push('gemini');
  if (providers.openai) availableProviders.push('openai');

  // If no providers are available, throw an error
  if (availableProviders.length === 0) {
    throw new Error('No AI providers configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in environment variables.');
  }

  let lastError;

  // Try each provider in order until one succeeds
  for (const providerName of availableProviders) {
    try {
      console.log(`Attempting to generate content with ${providerName}...`);

      let response;

      switch (providerName) {
        case 'gemini':
          // Try models in order: best first, with full fallback chain
          const geminiModels = options.model
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

          let geminiSuccess = false;
          for (const modelName of geminiModels) {
            try {
              console.log(`  Trying Gemini model: ${modelName}...`);
              const geminiModel = providers.gemini.getGenerativeModel({ model: modelName });
              const geminiResult = await geminiModel.generateContent(prompt);
              const geminiResponse = await geminiResult.response;
              response = geminiResponse.text();
              console.log(`  ✅ Gemini model ${modelName} succeeded`);
              geminiSuccess = true;
              break;
            } catch (modelError) {
              console.error(`  ❌ Gemini model ${modelName} failed: ${modelError.message}`);
              if (modelName === geminiModels[geminiModels.length - 1]) {
                throw modelError; // Re-throw if last model also failed
              }
            }
          }
          if (!geminiSuccess) {
            throw new Error('All Gemini models failed');
          }
          break;

        case 'openai':
          const openaiResponse = await providers.openai.chat.completions.create({
            model: options.model || "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: options.temperature || 0.7,
          });
          response = openaiResponse.choices[0].message.content;
          break;

        default:
          throw new Error(`Unsupported provider: ${providerName}`);
      }

      console.log(`${providerName} provider succeeded`);
      return response;

    } catch (error) {
      console.error(`Error with ${providerName} provider:`, error.message);
      lastError = error;

      // Check if this is a quota/usage limit error
      const isQuotaError = error.message.includes('quota') ||
        error.message.includes('limit') ||
        error.message.includes('exceeded') ||
        error.status === 429 ||
        error.message.includes('rate limit') ||
        error.message.includes('usage limit');

      if (isQuotaError) {
        console.log(`${providerName} provider has usage limits - will try next provider`);
        continue; // Continue to next provider
      } else {
        console.log(`${providerName} provider failed with non-quota error - will try next provider`);
        continue; // Continue to next provider
      }
    }
  }

  // If we reach here, all providers failed
  throw new Error(`All AI providers failed. Last error: ${lastError ? lastError.message : 'Unknown error'}`);
};

// Robust JSON extraction for responses
const extractJsonFromResponse = (responseText) => {
  try {
    if (!responseText || typeof responseText !== 'string') {
      throw new Error('Invalid response text provided');
    }

    // Look for JSON within code blocks first
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
      // Try to fix common JSON issues
      try {
        // Remove common markdown artifacts
        jsonString = jsonString.replace(/^```[a-z]*\s*\n?/gi, '');
        jsonString = jsonString.replace(/```\s*$/gi, '');
        jsonString = jsonString.replace(/^`+|`+$/g, '');
        jsonString = jsonString.trim();

        // Remove trailing commas before closing braces/brackets
        jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
        jsonString = jsonString.replace(/,\s*(?=\s*[}\]])/g, '');

        // Fix common formatting issues
        jsonString = jsonString.replace(/,\s*\n\s*[}\]]/g, match => match.trim());

        // Remove any remaining markdown or text artifacts
        jsonString = jsonString.replace(/^.*?\{/, '{'); // Remove text before first {
        jsonString = jsonString.replace(/\}[^}]*$/, '}'); // Remove text after last }

        // Handle unescaped quotes and special characters in strings
        // Find all string values and properly escape them
        jsonString = jsonString.replace(/:"([^"\\]*(?:\\.[^"\\]*)*)"/g, function (match, capturedString) {
          try {
            // Try to parse the string value to see if it's properly escaped
            JSON.parse('"' + capturedString + '"');
            return match; // If it parses fine, return as-is
          } catch (e) {
            // If it doesn't parse, escape it properly
            const escaped = capturedString
              .replace(/\\/g, '\\\\') // Escape backslashes first
              .replace(/"/g, '\\"')    // Escape quotes
              .replace(/\n/g, '\\n')    // Escape newlines
              .replace(/\r/g, '\\r')    // Escape carriage returns
              .replace(/\t/g, '\\t');   // Escape tabs
            return ':"' + escaped + '"';
          }
        });

        parsedData = JSON.parse(jsonString);
      } catch (fixError) {
        console.error('Failed to parse and fix JSON:', fixError.message);
        console.error('JsonString attempted:', jsonString.substring(0, 500) + '...');
        console.error('Response text (first 500 chars):', responseText.substring(0, 500) + '...');

        // If all parsing attempts fail, try a more aggressive approach
        try {
          // Extract content from the response as a fallback
          // Don't add truncation message, just return the raw content
          const fallbackData = {
            title: responseText.match(/"title"\s*:\s*"([^"]+)/i)?.[1] || 'Study Materials',
            content: responseText.substring(0, 15000),
            examples: [],
            practiceProblems: [],
            keyPoints: [],
            studyTips: [],
            relatedTopics: []
          };
          return fallbackData;
        } catch (fallbackError) {
          throw new Error(`Could not parse JSON: ${parseError.message}`);
        }
      }
    }

    return parsedData;
  } catch (error) {
    console.error('Error parsing JSON from AI response:', error);
    console.error('Response text (first 500 chars):', responseText.substring(0, 500) + '...');
    throw new Error('Invalid JSON response from AI: ' + error.message);
  }
};

// Function to generate content with fallback - now queues requests
const generateContentWithFallback = (prompt, options = {}) => {
  return new Promise((resolve, reject) => {
    // Add request to queue
    requestQueue.push({ prompt, options, resolve, reject });

    // If not currently processing, start processing
    if (!isProcessing) {
      processNextRequest();
    }
  });
};

// Wrapper function to maintain backward compatibility
const generateContent = (prompt, options = {}) => {
  return generateContentWithFallback(prompt, options);
};

// Generate personalized timetable using AI
const generatePersonalizedTimetable = async (subjects = [], studyHoursPerDay = 4) => {
  // Build 7-day date list starting from today
  const dates = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push({ date: `${yyyy}-${mm}-${dd}`, day: dayNames[d.getDay()] });
  }

  const subjectList = subjects.length > 0 ? subjects : ['Mathematics', 'Science', 'English'];

  const prompt = `
You are a study planner. Create a 7-day study timetable for a student.

Subjects: ${subjectList.join(', ')}
Study hours per day: ${studyHoursPerDay} hours
Dates: ${dates.map(d => `${d.date} (${d.day})`).join(', ')}

IMPORTANT: Respond with ONLY valid JSON. No markdown, no explanation, no extra text.

The JSON must match this exact structure:
{
  "title": "Personalized Study Timetable",
  "description": "A 7-day study schedule",
  "schedule": [
    {
      "subject": "Mathematics",
      "topic": "Algebra Basics",
      "startTime": "09:00",
      "endTime": "10:00",
      "date": "2026-02-16",
      "duration": 60,
      "priority": 3
    }
  ]
}

Rules:
- Each schedule item must have: subject (string), topic (string — a specific topic within that subject), startTime (HH:MM 24hr), endTime (HH:MM 24hr), date (YYYY-MM-DD from the dates above), duration (minutes as number), priority (1-5 where 5 is highest).
- Distribute subjects evenly across all 7 days.
- Study sessions should be 45-90 minutes each.
- Include study sessions from morning to evening, spread across the day.
- Generate at least 3-4 sessions per day.
- Use realistic topics related to each subject.
- Vary priority levels: harder/important topics get higher priority.
- Return ONLY the JSON object, nothing else.
`;

  try {
    const response = await generateContentWithFallback(prompt);
    const timetableData = extractJsonFromResponse(response);

    // Validate and fix the schedule items
    if (timetableData && timetableData.schedule && Array.isArray(timetableData.schedule)) {
      timetableData.schedule = timetableData.schedule
        .filter(item => item && item.subject)
        .map(item => ({
          subject: String(item.subject || 'General Study'),
          topic: String(item.topic || ''),
          startTime: String(item.startTime || '09:00'),
          endTime: String(item.endTime || '10:00'),
          date: String(item.date || dates[0].date),
          duration: Number(item.duration) || 60,
          priority: Math.min(5, Math.max(1, Number(item.priority) || 3)),
          isCompleted: false
        }));
    }

    return {
      title: timetableData.title || 'Personalized Study Timetable',
      description: timetableData.description || 'AI-generated weekly study schedule',
      schedule: timetableData.schedule || []
    };
  } catch (error) {
    console.error('Error generating personalized timetable:', error);

    // Build a proper fallback timetable matching the schema
    const fallbackSchedule = [];
    const timeSlots = [
      { startTime: '09:00', endTime: '10:00', duration: 60 },
      { startTime: '10:15', endTime: '11:15', duration: 60 },
      { startTime: '14:00', endTime: '15:00', duration: 60 },
    ];

    for (const dateInfo of dates) {
      timeSlots.forEach((slot, idx) => {
        const subjectIdx = (dates.indexOf(dateInfo) + idx) % subjectList.length;
        fallbackSchedule.push({
          subject: subjectList[subjectIdx],
          topic: `${subjectList[subjectIdx]} Review`,
          startTime: slot.startTime,
          endTime: slot.endTime,
          date: dateInfo.date,
          duration: slot.duration,
          priority: 3,
          isCompleted: false
        });
      });
    }

    return {
      title: 'Study Timetable',
      description: 'Auto-generated study schedule (AI was unavailable).',
      schedule: fallbackSchedule
    };
  }
};

// Generate detailed explanation like a professional teacher
const generateExplanation = async (subject, topic, concept) => {
  try {
    const prompt = `
      As a professional teacher, provide a detailed explanation for the following concept.
      
      Subject: ${subject}
      Topic: ${topic}
      Concept: ${concept}
      
      Structure your explanation like a professional teacher would in a classroom:
      1. Begin with an introduction explaining why this concept is important
      2. Provide a clear definition of the concept
      3. Explain the concept in detail with examples
      4. Include practical applications or real-world connections
      5. End with a brief summary and key takeaways
      
      Make the explanation comprehensive, clear, and educational.
      Use proper headings, bullet points, and structured paragraphs where appropriate.
      Aim for a detailed explanation that thoroughly covers the topic.
    `;

    const response = await generateContentWithFallback(prompt);
    return {
      subject,
      topic,
      concept,
      explanation: response
    };
  } catch (error) {
    console.error('Error generating explanation:', error);

    // Return a fallback explanation
    return {
      subject,
      topic,
      concept,
      explanation: `I'm sorry, I couldn't generate a detailed explanation for ${concept} in ${subject} (${topic}). Please try again later. In the meantime, I recommend reviewing your textbook or course materials for this topic.`
    };
  }
};

module.exports = {
  generateContent,
  generateContentWithFallback,
  extractJsonFromResponse,
  generatePersonalizedTimetable,
  generateExplanation
};