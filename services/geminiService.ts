import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RecipeSummary, RecipeDetail, CuisineType, RecipeTag, ImageSize } from "../types";

// Initialize Gemini AI Client
// API Key is injected via process.env.API_KEY
// Note: For image generation with gemini-3-pro-image-preview, the key must be selected by the user via window.aistudio
const getAiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  console.log("[geminiService] Initializing client. Key present?", !!apiKey, "Key length:", apiKey?.length);
  if (!apiKey) {
    throw new Error("Missing API Key. Please add VITE_GEMINI_API_KEY to your Vercel Environment Variables and Redeploy.");
  }
  return new GoogleGenAI({ apiKey });
};

const MODEL_NAME = "gemini-1.5-flash-001";
const IMAGE_MODEL_NAME = "gemini-1.5-pro";

export const generateRecipeList = async (
  cuisine: CuisineType | null,
  tag: RecipeTag | null,
  dietary: string[] = [],
  searchQuery?: string
): Promise<RecipeSummary[]> => {
  const ai = getAiClient();

  const dietaryContext = dietary.length > 0 ? ` that are strictly ${dietary.join(" and ")}` : "";

  let prompt = "";
  if (searchQuery) {
    prompt = `Generate a list of 4 distinct and popular recipes${dietaryContext} that match the search query "${searchQuery}". 
    If the query implies a specific cuisine, focus on that.`;
  } else {
    prompt = `Generate a list of 4 distinct and popular ${cuisine} recipes${dietaryContext} that fit the category "${tag}".`;
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
  cuisine: CuisineType | null,
  dietary: string[] = []
): Promise<RecipeDetail> => {
  console.log(`[geminiService] generateRecipeDetail called for: ${recipeName}, cuisine: ${cuisine}`);
  const ai = getAiClient();
  const cuisineContext = cuisine ? `(${cuisine} cuisine)` : '';
  const dietaryContext = dietary.length > 0 ? `(Strictly ${dietary.join(", ")})` : "";
  const prompt = `Provide a detailed cooking guide for "${recipeName}" ${cuisineContext} ${dietaryContext}. 
  Include a brief history or cultural significance, a list of ingredients with measurements, step-by-step instructions, and specific chef's tips for the best result.
  IMPORTANT: All cooking temperatures must be provided in both Fahrenheit and Celsius (e.g. 350°F / 175°C).`;

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

export const generateChefReply = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]
): Promise<string> => {
  const ai = getAiClient();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash-001",
      config: {
        systemInstruction: "You are a Michelin-star Executive Chef with expert visual analysis skills. The user has provided an image of their ingredients, pantry, fridge, or a specific food product. \n\nYOUR TASKS:\n1. IDENTIFY: Accurately identify visible ingredients.\n2. READ TEXT: Read any labels, packaging text, nutritional info, or handwritten notes in the image to verify brands or specific product types (OCR).\n3. IGNORE: Ignore non-food items unless relevant to cooking context.\n4. ADVISE: Help them decide what to cook, identifying missing staples if necessary.\n\nBe encouraging, professional, but friendly. Keep responses concise (under 50 words) unless asked for a full recipe.",
        maxOutputTokens: 500,
      },
      contents: history
    });

    return response.text || "I'm sorry, I couldn't come up with a response.";
  } catch (error: any) {
    console.error("Error in chef chat:", error);
    // Be more specific if possible
    if (error.response?.promptFeedback?.blockReason) {
      return `I cannot process this image due to safety settings (${error.response.promptFeedback.blockReason}). Please try another image.`;
    }
    throw new Error(`Gemini API Error: ${error.message || JSON.stringify(error)}`);
  }
};

export const generateRecipeFromImage = async (
  base64Image: string
): Promise<RecipeSummary> => {
  const ai = getAiClient();

  // Detect mime type from base64 header
  const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

  // Clean base64 string
  const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");

  const prompt = `Analyze this image, which may be a finished dish, raw ingredients, or a view inside a fridge/pantry.
  1. If it's a finished dish, identify it.
  2. If it's ingredients or a pantry/fridge view, identify the visible items and suggest the BEST recipe you can make with them.
  3. Ignore non-food items. If you are unsure, make a best guess based on common staples suitable for what is visible.

  Return a SINGLE JSON object matching this schema:
  {
    "name": "Name of the Dish",
    "description": "Appetizing description based on visual analysis",
    "prepTime": "Estimated prep time",
    "difficulty": "Easy/Medium/Hard",
    "imageKeyword": "Main ingredient or dish name for search"
  }`;

  try {
    console.log(`[geminiService] analyzing image (${mimeType}) with gemini-1.5-flash...`);

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash-001",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: cleanBase64
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json", // Enforce JSON output
      }
    });

    const text = response.text;
    console.log("[geminiService] Analysis result:", text ? text.substring(0, 50) + "..." : "No text");

    if (!text) throw new Error("No analysis received from AI");

    return JSON.parse(text) as RecipeSummary;

  } catch (error: any) {
    console.error("Error analyzing image:", error);
    // Log more details if available
    if (error.response) {
      console.error("API Error details:", JSON.stringify(error.response));
    }
    throw new Error("Failed to analyze the image: " + (error.message || "Unknown error"));
  }
};


// Helper to convert base64 to Blob
const base64ToBlob = (base64: string, mimeType: string) => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

export const generateImage = async (
  prompt: string,
  size: ImageSize,
  aspectRatio: string = "16:9"
): Promise<string> => {
  // Always create a new client
  const ai = getAiClient();

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
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

import { supabase } from "./supabaseClient";

/**
 * Checks Supabase Storage for an existing image for the recipe.
 * If found, returns the public URL.
 * If not, generates a new one, uploads it, and returns the URL.
 */
export const getOrGenerateImage = async (
  recipeName: string,
  prompt: string,
  size: ImageSize = '1K'
): Promise<string> => {
  try {
    // 1. Sanitize filename
    const filename = `${recipeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
    const bucket = 'recipe-images';

    // 2. Check if exists (HEAD request or try to get public URL and check validity??)
    // Simpler: Just try to get Public URL. If we want to be sure it exists, we might need a list or metadata check.
    // However, Storage Public URLs are predictable.
    // Let's try to 'download' metadata or list to see if it exists to avoid trying to load a 404 image on client.

    const { data: existingFiles } = await supabase
      .storage
      .from(bucket)
      .list('', {
        limit: 1,
        search: filename
      });

    if (existingFiles && existingFiles.length > 0) {
      console.log(`[Cache Hit] Found image for ${recipeName}`);
      const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
      return data.publicUrl;
    }

    console.log(`[Cache Miss] Generating image for ${recipeName}...`);

    // 3. Generate
    const base64Image = await generateImage(prompt, size, '4:3');

    // 4. Upload
    // Extract actual base64 data (remove "data:image/png;base64,")
    const base64Data = base64Image.split(',')[1];
    const blob = base64ToBlob(base64Data, 'image/png');

    const { error: uploadError } = await supabase
      .storage
      .from(bucket)
      .upload(filename, blob, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.warn("Failed to upload to cache, returning base64:", uploadError);
      return base64Image;
    }

    // 5. Return new Public URL
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filename);
    return publicUrlData.publicUrl;

  } catch (err) {
    console.error("Error in getOrGenerateImage:", err);
    // Fallback to generating without cache if something fails
    return await generateImage(prompt, size, '4:3');
  }
};