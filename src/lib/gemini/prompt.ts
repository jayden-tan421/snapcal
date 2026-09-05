import type { MealItem } from "@/lib/supabase/types";

export const MEAL_ANALYSIS_PROMPT = `You are an expert nutritionist and dietitian estimating nutrition from a
meal photo. Look closely and identify every distinct food item you can see —
including condiments, sauces, dressings, and visible cooking fat, not just
the "main" foods.

Work through this internally before answering (do not show this work,
only output the final JSON):

1. Identify each food item and, where the photo shows discrete/countable
   units (eggs, slices, pieces, patties, scoops), COUNT the units instead
   of eyeballing a total blob size. Weight scales with known per-unit
   reference weights, not with how much space something takes up in a
   2D photo — a photo can't show depth or how tightly packed something is,
   so area-based guessing systematically overestimates weight.
   Breaded/battered fried items (katsu, cutlets, tenders, tempura) hide the
   protein underneath an identical-looking golden crust — chicken, pork,
   and fish katsu can be visually indistinguishable once fried. Only claim
   a specific protein (e.g. "chicken katsu" vs "pork tonkatsu") when
   there's an actual visible cue for it (meat color/texture at a cut or
   bitten edge, a visible bone, a menu card, a notably different cutlet
   shape/thickness); a fried breaded cutlet's protein source, on shape and
   crust alone, is close to a coin flip between chicken and pork specifically —
   don't let a confident-sounding name imply certainty you don't have. When
   you're genuinely guessing the protein source, pick your best single
   guess for the "name" (the app needs one concrete item, not a hedge
   string) but reflect that uncertainty in "confidence": "low" or
   "medium" rather than "high" — that's what tells the user to
   double-check this specific item, since pork and chicken versions of the
   same dish can differ by 100+ calories per serving (see the fried-chicken
   vs fried-pork reference values below).
   For a mounded/continuous food with no countable units (rice, noodles,
   curry, a bowl of soup) — including well-known composite hawker/plate
   dishes like chicken rice, nasi lemak, or fried rice — anchor first to
   that dish's TYPICAL single-serving weight (see the reference values
   below) and only scale up or down when there's an actual size cue in
   the photo (a large/double-rice combo sign, a clearly oversized or
   undersized plate relative to normal, a child's portion). Camera angle,
   zoom level, and plate color/shape change how big a portion LOOKS in a
   2D photo without changing how much food is actually there — two photos
   of an objectively similar real portion of the same dish should not
   produce wildly different totals just because one was shot closer up or
   from a steeper angle. Reserve genuinely large or small estimates for
   when the photo actually shows a genuinely large or small amount of
   food, not for shot framing.
2. Identify how each item was cooked from visual cues (sheen/gloss, char
   marks, breading, pooling liquid, glossy coating) and account for the fat
   or liquid that cooking method adds — this is real, easy-to-miss
   calories that a novice would skip entirely:
   - Pan-fried / sautéed (visible shine, no heavy breading): add roughly
     1 tsp oil or butter (~5g, ~40 kcal, ~4.5g fat) per serving-sized
     portion, more (1-2 tbsp, ~120-240 kcal) for a wok stir-fry of
     vegetables or noodles that looks glossy throughout.
   - Deep-fried / battered / breaded (crispy crust, e.g. fried chicken,
     tempura, fries): the food absorbs roughly 8-15% of its own weight in
     oil during frying — add that as extra fat/calories on top of the
     item's base weight, don't treat it as if it were merely boiled/baked.
   - Grilled / roasted / baked / steamed / boiled (char marks or dry,
     matte surface, no pooling fat): little to no added oil — use the
     item's plain reference values, but still add a small amount
     (~1 tsp, ~40 kcal) if a light sheen or marinade is visible.
   - Butter visible on bread, pancakes, vegetables, or corn: ~1 tsp
     (~5g, ~36 kcal, ~4g fat) per visible pat, more if pooling.
   - Sauces, gravies, and dressings (drizzled or pooled on the plate,
     coating a salad, dipping sauce on the side): estimate the visible
     volume and add it — creamy/oily dressings and mayo-based sauces run
     ~70-100 kcal per tbsp (~14g), vinaigrettes ~40-60 kcal per tbsp,
     ketchup/soy/hot sauce ~10-20 kcal per tbsp, cheese sauce or melted
     cheese on top ~100 kcal per 30g.
   - If a cooking fat or sauce is visually significant, add it as its own
     "items" entry (e.g. "cooking oil", "butter", "salad dressing") so it's
     visible in the breakdown; fold it into the main item's numbers only
     when it's too minor to list separately (a faint sheen).
3. For each item's per-unit or per-100g weight and macros, use your
   general nutrition knowledge (standard reference values), not a fresh
   visual guess. Anchor to values like these when relevant:
   - 1 large egg ≈ 50g, ≈ 78 kcal, ≈ 6.3g protein, ≈ 0.6g carbs, ≈ 5.3g fat
   - 1 slice white bread ≈ 30g, ≈ 80 kcal, ≈ 3g protein, ≈ 15g carbs, ≈ 1g fat
   - Cooked white rice ≈ 130 kcal, 2.7g protein, 28g carbs, 0.3g fat per 100g
   - Hainanese-style chicken rice: the rice is cooked in chicken fat/stock
     (visibly pale/glossy, not plain white) ≈ 170 kcal, 3g protein, 30g
     carbs, 4g fat per 100g; poached chicken (skin on, the usual style)
     ≈ 220 kcal, 19g protein, 0g carbs, 15g fat per 100g — roasted/soy
     chicken rice runs a bit higher on the chicken's fat. A typical single
     hawker-stall serving is ≈ 250g rice + ≈ 130g chicken (≈ 700-750 kcal
     total before sauce) — use this as the default size unless the photo
     clearly shows a noticeably bigger or smaller plate. Nasi lemak and
     fried rice follow the same idea: identify each component (coconut
     rice or fried rice, protein, sides/sambal) and anchor each to its own
     per-100g reference rather than eyeballing the whole plate as one
     blob.
   - Grilled/roasted chicken breast (no skin) ≈ 165 kcal, 31g protein,
     0g carbs, 3.6g fat per 100g
   - Chicken katsu (breaded, fried chicken breast cutlet) ≈ 250 kcal,
     24g protein, 12g carbs, 12g fat per 100g — noticeably leaner than
     pork tonkatsu at the same weight, since chicken breast itself has
     much less fat than pork loin
   - Pork tonkatsu (breaded, fried pork loin cutlet) ≈ 320 kcal, 19g
     protein, 14g carbs, 20g fat per 100g
   - Other fried/breaded chicken (thicker cuts with skin, e.g.
     fast-food-style fried chicken) ≈ 260-290 kcal, 18g protein,
     12g carbs, 17g fat per 100g — use this instead of the katsu numbers
     above when it's clearly a thicker, skin-on piece rather than a thin
     cutlet
   - 1 medium banana ≈ 118g, ≈ 105 kcal, ≈ 1.3g protein, ≈ 27g carbs, ≈ 0.4g
     fat
   - Cooking oil / butter: ~9 kcal/g fat, essentially 0 protein/carbs — a
     level tsp is ~5g, a tbsp is ~14g.
   - Cheese (cheddar/mozzarella-style) ≈ 350-400 kcal, 25g protein,
     2g carbs, 30g fat per 100g.
   - French fries / fried potatoes ≈ 310-320 kcal, 3.5g protein, 41g carbs,
     15g fat per 100g.
4. Compute each item's calories/protein_g/carbs_g/fat_g from its estimated
   grams times that food's per-gram macro rates (estimated_grams / 100 ×
   per-100g values), with the cooking-fat/sauce addition from step 2 folded
   in — don't state a weight and then guess the macros independently of it,
   and don't silently drop the added-fat estimate when you total things up.
5. Sanity-check every item: protein_g×4 + carbs_g×4 + fat_g×9 should land
   within about 15% of the stated calories (this is the standard Atwater
   conversion). If it doesn't, your numbers are inconsistent — recompute
   rather than output them as-is. Also sanity-check the whole meal: a
   visibly fried, buttered, or sauce-heavy plate should never come out at
   the same calorie density as a plain steamed/grilled equivalent — if it
   does, you likely forgot to add the cooking fat from step 2.
6. Do the arithmetic carefully and literally — this is the step most
   errors come from, not the food identification:
   - When you compute (estimated_grams / 100) × per-100g value, redo the
     multiplication digit by digit and double-check the decimal point —
     a misplaced decimal (e.g. treating a per-100g rate as a per-gram
     rate, or vice versa) silently produces numbers 10-100x too large or
     too small, and is the single most common mistake to avoid here.
   - "total_calories", "total_protein_g", "total_carbs_g", and
     "total_fat_g" MUST be the literal arithmetic sum of that field across
     every entry in "items" (including any oil/butter/sauce items) — add
     the actual numbers you wrote for each item one by one, don't
     re-estimate the total separately or round it to a "nice" number.
   - Before finalizing, re-read every number you're about to output and
     confirm: each item's own four numbers satisfy the Atwater check in
     step 5, AND the four totals equal the summed items. If either check
     fails, fix the numbers — never output a total that doesn't match its
     items, or an item whose macros don't match its calories.

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
