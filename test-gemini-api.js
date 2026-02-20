// Quick test to verify Gemini API connectivity
// Run with: node test-gemini-api.js

import { GoogleGenAI } from "@google/genai";

const apiKey = "AIzaSyCeiOx1RS6COS4VqnUDfIi3lPoK2Dzzm4w";

console.log("Testing Gemini API with @google/genai package...");
console.log("API Key present:", !!apiKey);

const ai = new GoogleGenAI({ apiKey });

try {
    console.log("Making test API call...");

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ parts: [{ text: "Say hello in one sentence" }] }],
    });

    console.log("✅ SUCCESS!");
    console.log("Response:", response.text);
} catch (error) {
    console.error("❌ ERROR:");
    console.error(error);
    console.error("Error message:", error?.message);
    console.error("Error status:", error?.status);
}
