import { GoogleGenerativeAI } from "@google/generative-ai";

const KEYS = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2
].filter(k => k && k.length > 10);

if (KEYS.length === 0) {
    console.warn("⚠️ No GEMINI_API_KEY found in environment variables.");
}

const models = KEYS.map(key => {
    const genAI = new GoogleGenerativeAI(key);
    // Upgrading to 1.5 Flash for better reliability
    return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
});

let currentKeyIndex = 0;

// Export a proxy object that mimics the original 'model' interface
// allowing seamless drop-in replacement without changing other files.
export const model = {
    generateContent: async (prompt) => {
        if (models.length === 0) throw new Error("No API Keys configured");

        const retries = 3;
        for (let i = 0; i < retries; i++) {
            const modelIndex = currentKeyIndex % models.length;
            const activeModel = models[modelIndex];

            try {
                const result = await activeModel.generateContent(prompt);
                currentKeyIndex++; // Rotate on success
                return result;
            } catch (e) {
                const isRateLimit = e.message?.includes('429') || e.message?.includes('Quota');

                if (isRateLimit) {
                    console.warn(`⚠️ Key #${modelIndex + 1} Rate Limited. Switching...`);

                    // Failover logic
                    for (let j = 1; j < models.length; j++) {
                        const nextIndex = (modelIndex + j) % models.length;
                        try {
                            const result = await models[nextIndex].generateContent(prompt);
                            currentKeyIndex = nextIndex + 1;
                            return result;
                        } catch (innerE) { /* Continue searching */ }
                    }

                    // If we are here, all keys failed. Wait a bit if not last retry
                    if (i < retries - 1) await new Promise(r => setTimeout(r, 2000));
                } else {
                    throw e; // Real error
                }
            }
        }
        throw new Error("All Gemini keys exhausted or rate limited.");
    }
};
