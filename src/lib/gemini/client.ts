import { GoogleGenerativeAI } from "@google/generative-ai";

let client: GoogleGenerativeAI | null = null;

/** Server-only. Never import this from a Client Component. */
export function getGeminiClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

// A stable alias that always points at Google's current flash model, so we
// don't need a code change every time a newer flash model ships.
export const GEMINI_MODEL = "gemini-flash-latest";
