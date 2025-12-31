import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RecipeSummary, RecipeDetail, CuisineType, RecipeTag, ImageSize } from "../types";

// Initialize Gemini AI Client
// API Key is injected via process.env.API_KEY
// Note: For image generation with gemini-3-pro-image-preview, the key must be selected by the user via window.aistudio
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Missing API Key. Please add GEMINI_API_KEY to your Vercel Environment Variables and Redeploy.");
  }
  return new GoogleGenAI({ apiKey });
};

const MODEL_NAME = "gemini-3-flash-preview";
const IMAGE_MODEL_NAME = "gemini-3-pro-image-preview";

export const generateRecipeList = async (
  cuisine: CuisineType | null,
  tag: RecipeTag | null,
  searchQuery?: string
): Promise<RecipeSummary[]> => {
  const ai = getAiClient();

  let prompt = "";
  if (searchQuery) {
    prompt = `Generate a list of 4 distinct and popular recipes that match the search query "${searchQuery}". 
    If the query implies a specific cuisine, focus on that.`;
  } else {
    prompt = `Generate a list of 4 distinct and popular ${cuisine} recipes that fit the category "${tag}".`;
  }

  prompt += ` Provide a short description, prep time, difficulty level, and a single keyword to search for an image.`;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Name of the dish" },
        description: { type: Type.STRING, description: "One sentence appetizing description" },
        prepTime: { type: Type.STRING, description: "e.g., 20 mins" },
        difficulty: { type: Type.STRING, description: "Easy, Medium, or Hard" },
        imageKeyword: { type: Type.STRING, description: "A simple english noun for image search, e.g. pasta, curry, taco" }
      },
      required: ["name", "description", "prepTime", "difficulty", "imageKeyword"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are a world-class executive chef. Suggest authentic and high-quality recipes.",
      },
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as RecipeSummary[];
  } catch (error) {
    console.error("Error generating recipe list:", error);
    throw new Error("Failed to fetch recipes from the AI Chef.");
  }
};

export const generateRecipeDetail = async (
  recipeName: string,
  cuisine: CuisineType | null
): Promise<RecipeDetail> => {
  console.log(`[geminiService] generateRecipeDetail called for: ${recipeName}, cuisine: ${cuisine}`);
  const ai = getAiClient();
  const cuisineContext = cuisine ? `(${cuisine} cuisine)` : '';
  const prompt = `Provide a detailed cooking guide for "${recipeName}" ${cuisineContext}. 
  Include a brief history or cultural significance, a list of ingredients with measurements, step-by-step instructions, and specific chef's tips for the best result.`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      description: { type: Type.STRING },
      prepTime: { type: Type.STRING },
      difficulty: { type: Type.STRING },
      imageKeyword: { type: Type.STRING },
      history: { type: Type.STRING, description: "Cultural background and history of the dish (approx 50 words)" },
      ingredients: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of ingredients with quantities"
      },
      instructions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Step by step cooking instructions"
      },
      chefTips: { type: Type.STRING, description: "Expert advice for elevating the dish" },
      flavorProfile: { type: Type.STRING, description: "Description of taste (e.g., Savory, Umami, Spicy)" }
    },
    required: ["name", "description", "history", "ingredients", "instructions", "chefTips", "flavorProfile"]
  };

  try {
    console.log("[geminiService] Sending generating content request for detail...");
    // Add a race with a timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout generating recipe detail")), 20000)
    );

    const apiCallPromise = ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are a culinary historian and expert chef. Explain the recipe with passion and precision.",
      },
    });

    const response = await Promise.race([apiCallPromise, timeoutPromise]) as any; // Cast to any to avoid type issues with race result
    console.log("[geminiService] Received response for detail.");

    const text = response.text;
    console.log("[geminiService] Response text length:", text?.length);

    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as RecipeDetail;
  } catch (error) {
    console.error("Error generating recipe detail:", error);
    throw new Error("Failed to retrieve the detailed recipe.");
  }
};

export const generateImage = async (
  prompt: string,
  size: ImageSize,
  aspectRatio: string = "16:9"
): Promise<string> => {
  // Always create a new client to ensure we pick up the latest API key from process.env if it changed via aistudio selector
  const ai = getAiClient();

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio, // Dynamic aspect ratio
          imageSize: size
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64String = part.inlineData.data;
        return `data:image/png;base64,${base64String}`;
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};