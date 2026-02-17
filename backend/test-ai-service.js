require('dotenv').config();
const { generateContent } = require('./utils/geminiService');

async function testAI() {
    console.log('Testing Gemini AI Service...');
    try {
        const prompt = "Explain the difference between a stack and a queue in one sentence.";
        console.log(`Sending prompt: "${prompt}"`);

        const response = await generateContent(prompt, 'test-user');

        console.log('\n✅ Response received:');
        console.log(response);
    } catch (error) {
        console.error('\n❌ Error testing AI service:');
        console.error('Message:', error.message);
        if (error.response) {
            console.error('Response:', await error.response.text());
        }
        console.error('Stack:', error.stack);
    }
}

testAI();
