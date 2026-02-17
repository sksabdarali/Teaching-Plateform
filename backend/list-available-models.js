require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('No API key found!');
        return;
    }

    // Using a direct fetch approach because the SDK's listModels might be wrapped differently
    // Actually the SDK doesn't expose listModels on the client instance in all versions.
    // Let's try to use the raw REST API to list models if SDK fails, but let's try the SDK first if we can find the method.
    // In @google/generative-ai 0.1.0+, there isn't a direct listModels on the client.
    // But we can use the ModelManager if it exists.

    // Alternative: Use fetch directly.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    console.log('Fetching models from:', url.replace(apiKey, 'HIDDEN_KEY'));

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`HTTP Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error('Response:', text);
            return;
        }

        const data = await response.json();
        console.log('\nAvailable Models:');
        if (data.models) {
            data.models.forEach(m => {
                console.log(`- ${m.name}`);
                console.log(`  Supported methods: ${m.supportedGenerationMethods.join(', ')}`);
            });
        } else {
            console.log('No models property in response:', data);
        }

    } catch (error) {
        console.error('Fetch error:', error);
    }
}

listModels();
