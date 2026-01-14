require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("No API Key found in .env");
        return;
    }
    console.log("Using Key ending in:", key.slice(-4));

    try {
        const genAI = new GoogleGenerativeAI(key);
        // Note: listModels is not directly on genAI instance usually, 
        // the SDK might rely on specific model get, or we use REST.
        // Let's try to fetch a specific model to see if it works, or use a REST call for list.

        // Direct REST call to list models is safer to see what's truly available
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        console.log(`Fetching models from: ${url}`);

        const res = await fetch(url);
        const data = await res.json();

        if (data.error) {
            console.error("API Error:", JSON.stringify(data.error, null, 2));
        } else if (data.models) {
            console.log("✅ Available Models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(` - ${m.name} (${m.displayName})`);
                }
            });
        } else {
            console.log("Unknown response:", data);
        }

    } catch (e) {
        console.error("Script Error:", e);
    }
}

listModels();
