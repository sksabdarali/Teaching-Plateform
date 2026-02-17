require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('No API key found!');
        return;
    }
    console.log('API Key found:', apiKey.substring(0, 5) + '...');

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        // For gemini-1.5-flash which is a newer model, sometimes listing doesn't show it if the SDK is old, 
        // but we can try to get it directly.
        // But first let's see what's available.
        // Note: listModels might not be available on the client instance directly depending on version, 
        // usually it's on a ModelManager or similar, but let's try a simple generation with 'gemini-pro' as fallback check.

        console.log('Attempting to generate with gemini-pro to check connection...');
        const modelPro = genAI.getGenerativeModel({ model: 'gemini-pro' });
        try {
            const result = await modelPro.generateContent('Hello');
            console.log('✅ gemini-pro is working. Response:', result.response.text());
        } catch (e) {
            console.log('❌ gemini-pro failed:', e.message);
            if (e.response) console.log('Response:', await e.response.text());
        }

        console.log('\nAttempting to generate with gemini-1.5-flash...');
        const modelFlash = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        try {
            const result = await modelFlash.generateContent('Hello');
            console.log('✅ gemini-1.5-flash is working. Response:', result.response.text());
        } catch (e) {
            console.log('❌ gemini-1.5-flash failed:', e.message);
            if (e.response) console.log('Response:', await e.response.text());
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

listModels();
