import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = "AIzaSyA1qTbFOE1Mze2bL8x2CsMlPGxwMbNaHy4";
const MODEL = "gemini-2.5-flash";

async function testDetail() {
    console.log("Testing generateRecipeDetail with model:", MODEL);
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const schema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            prepTime: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            history: { type: Type.STRING },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
            chefTips: { type: Type.STRING },
            flavorProfile: { type: Type.STRING },
        },
        required: ["name", "description", "history", "ingredients", "instructions", "chefTips", "flavorProfile"]
    };

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: [{ parts: [{ text: 'Provide a detailed cooking guide for "Chicken Paella".' }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                systemInstruction: "You are a culinary historian and expert chef.",
            },
        });
        const parsed = JSON.parse(response.text);
        console.log("✅ SUCCESS! Recipe name:", parsed.name);
        console.log("Ingredients count:", parsed.ingredients?.length);
        console.log("Steps count:", parsed.instructions?.length);
    } catch (err) {
        console.error("❌ FAILED:", err.message);
    }
}

testDetail();
