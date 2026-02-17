require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

async function testModel(genAI, modelName) {
    const log = [];
    log.push(`\n--- Testing model: ${modelName} ---`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say hello');
        const response = await result.response;
        log.push(`✅ SUCCESS! Response: ${response.text()}`);
        return { success: true, name: modelName, log: log.join('\n') };
    } catch (error) {
        log.push(`❌ FAILED.`);
        log.push(`Error Message: ${error.message}`);
        if (error.response) {
            log.push(`Error Response: ${JSON.stringify(error.response)}`);
        }
        return { success: false, name: modelName, log: log.join('\n') };
    }
}

async function runTests() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
        fs.writeFileSync('model_test_results.txt', 'No API Key found in .env');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTest = [
        'gemini-1.5-flash',
        'models/gemini-1.5-flash',
        'gemini-1.5-pro',
        'models/gemini-1.5-pro',
        'gemini-pro',
        'models/gemini-pro'
    ];

    let output = `Testing models with API Key ending in ...${apiKey.slice(-5)}\n`;

    for (const model of modelsToTest) {
        const result = await testModel(genAI, model);
        output += result.log;
    }

    fs.writeFileSync('model_test_results.txt', output);
    console.log('Tests completed. Results written to model_test_results.txt');
}

runTests();
