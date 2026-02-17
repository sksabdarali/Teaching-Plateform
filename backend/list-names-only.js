require('dotenv').config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            console.log("--- START MODEL LIST ---");
            data.models.forEach(m => console.log(m.name));
            console.log("--- END MODEL LIST ---");
        } else {
            console.log("No models found or error:", JSON.stringify(data));
        }
    } catch (e) {
        console.error(e);
    }
}

listModels();
