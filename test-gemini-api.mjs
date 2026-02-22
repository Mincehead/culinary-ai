// Quick test script - node test-gemini-api.mjs
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = "AIzaSyA1qTbFOE1Mze2bL8x2CsMlPGxwMbNaHy4";
const MODEL = "gemini-2.5-flash";

async function test() {
    console.log("Testing with model:", MODEL);
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                prepTime: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                imageKeyword: { type: Type.STRING }
            },
            required: ["name", "description", "prepTime", "difficulty", "imageKeyword"]
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: [{ parts: [{ text: 'Suggest 4 recipes using chicken and rice. Provide name, description, prepTime, difficulty, imageKeyword.' }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                systemInstruction: "You are a world-class executive chef.",
            },
        });

        console.log("✅ SUCCESS! Response:", response.text.substring(0, 300));
    } catch (err) {
        console.error("❌ FAILED:", err.message);
        try {
            const parsed = JSON.parse(err.message);
            console.error("Error details:", JSON.stringify(parsed, null, 2));
        } catch (_) { }
    }
}

test();
