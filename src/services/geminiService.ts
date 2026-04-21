import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function interpretTerm(term: string, definition: string) {
  const prompt = `You are a professional linguistic and technical expert. 
Provide a deep interpretation and contextual explanation for the following glossary term:
Term: "${term}"
Initial Definition: "${definition}"

Your explanation should include:
1. Contextual usage (provide an example sentence).
2. Nuances or cultural significance if applicable.
3. Why this term is important in its category.

Keep the tone professional and helpful. Keep the response concise but insightful.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Could not generate interpretation.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating interpretation. Please check connectivity.";
  }
}

export async function quickTranslate(text: string, targetLanguage: string) {
  const prompt = `Translate the following text into ${targetLanguage}:
Text: "${text}"

Provide ONLY the translation string, no other text.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Translation failed.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Translation error.";
  }
}
