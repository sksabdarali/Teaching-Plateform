require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not set in environment variables!');
    console.log('Set it with: set GEMINI_API_KEY=your_key_here');
    process.exit(1);
}

console.log(`API Key found: ${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}\n`);

const genAI = new GoogleGenerativeAI(apiKey);

const testModels = async () => {
    const models = ["gemini-2.5-flash", "gemini-2.0-flash"];

    for (const modelName of models) {
        console.log(`--- Testing: ${modelName} ---`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Say "hello" in one word.');
            const response = await result.response;
            const text = response.text();
            console.log(`✅ ${modelName} works! Response: "${text.trim()}"\n`);
        } catch (error) {
            console.log(`❌ ${modelName} failed: ${error.message}\n`);
        }
    }

    console.log('--- Testing via aiService.js ---');
    try {
        const { generateContent } = require('./utils/aiService');
        const response = await generateContent('Say "test successful" in one short sentence.');
        console.log(`✅ aiService works! Response: "${response.trim()}"\n`);
    } catch (error) {
        console.log(`❌ aiService failed: ${error.message}\n`);
    }

    console.log('--- Testing via geminiService.js ---');
    try {
        const { generateContent } = require('./utils/geminiService');
        const response = await generateContent('Say "test successful" in one short sentence.');
        console.log(`✅ geminiService works! Response: "${response.trim()}"\n`);
    } catch (error) {
        console.log(`❌ geminiService failed: ${error.message}\n`);
    }
};

testModels();
