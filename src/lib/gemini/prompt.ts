import type { MealItem } from "@/lib/supabase/types";

export const MEAL_ANALYSIS_PROMPT = `You are a nutrition estimation assistant. Look at the photo of a meal and
identify every distinct food item you can see. For each item, estimate its
portion size in grams and its nutrition.

Respond with ONLY raw JSON — no markdown code fences, no commentary, no
explanation before or after. Match this exact shape:

{
  "items": [
    {
      "name": "grilled chicken breast",
      "estimated_grams": 150,
      "calories": 250,
      "protein_g": 46,
      "carbs_g": 0,
      "fat_g": 5
    }
  ],
  "total_calories": 250,
  "total_protein_g": 46,
  "total_carbs_g": 0,
  "total_fat_g": 5,
  "confidence": "medium"
}

Rules:
- "confidence" must be exactly one of "low", "medium", or "high", reflecting
  how certain you are about the portion sizes and identification.
- The "total_*" fields must equal the sum of the corresponding per-item
  fields across all "items".
- All numbers are plain numbers (no units, no strings).
- If the image does not contain food, return "items": [] and all totals as 0
  with "confidence": "low".
- Never wrap the JSON in \`\`\` fences or add any text outside the JSON object.`;

export interface MealAnalysis {
  items: MealItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  confidence: "low" | "medium" | "high";
}

/**
 * Gemini sometimes wraps JSON in ```json fences, or adds stray whitespace.
 * Strip that, parse, and validate the shape before trusting the response.
 */
export function parseMealAnalysis(raw: string): MealAnalysis | null {
  const stripped = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  let data: unknown;
  try {
    data = JSON.parse(stripped);
  } catch {
    // Gemini occasionally adds a stray sentence before/after the JSON —
    // fall back to extracting the first {...} block and retry once.
    const match = stripped.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      data = JSON.parse(match[0]);
    } catch {
      return null;
    }
  }

  return validateShape(data);
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && !isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

function validateShape(data: unknown): MealAnalysis | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  if (!Array.isArray(d.items)) return null;

  const items: MealItem[] = [];
  for (const raw of d.items) {
    if (!raw || typeof raw !== "object") return null;
    const item = raw as Record<string, unknown>;
    const name = typeof item.name === "string" ? item.name : null;
    const estimated_grams = num(item.estimated_grams);
    const calories = num(item.calories);
    const protein_g = num(item.protein_g);
    const carbs_g = num(item.carbs_g);
    const fat_g = num(item.fat_g);
    if (
      name === null ||
      estimated_grams === null ||
      calories === null ||
      protein_g === null ||
      carbs_g === null ||
      fat_g === null
    ) {
      return null;
    }
    items.push({ name, estimated_grams, calories, protein_g, carbs_g, fat_g });
  }

  const total_calories = num(d.total_calories);
  const total_protein_g = num(d.total_protein_g);
  const total_carbs_g = num(d.total_carbs_g);
  const total_fat_g = num(d.total_fat_g);
  const confidence =
    d.confidence === "low" || d.confidence === "medium" || d.confidence === "high"
      ? d.confidence
      : "medium";

  if (
    total_calories === null ||
    total_protein_g === null ||
    total_carbs_g === null ||
    total_fat_g === null
  ) {
    return null;
  }

  return {
    items,
    total_calories,
    total_protein_g,
    total_carbs_g,
    total_fat_g,
    confidence,
  };
}
