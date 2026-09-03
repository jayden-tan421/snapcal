"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MealItem, MealSource, Confidence } from "@/lib/supabase/types";

export type SaveMealInput = {
  items: MealItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  notes?: string | null;
  source: MealSource;
  confidence?: Confidence | null;
};

export async function saveMealAction(input: SaveMealInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { error } = await supabase.from("meals").insert({
    user_id: user.id,
    items: input.items,
    total_calories: round(input.total_calories),
    total_protein_g: round(input.total_protein_g),
    total_carbs_g: round(input.total_carbs_g),
    total_fat_g: round(input.total_fat_g),
    notes: input.notes || null,
    source: input.source,
    confidence: input.confidence ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/history");
  return { success: true };
}

export async function deleteMealAction(mealId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { error } = await supabase
    .from("meals")
    .delete()
    .eq("id", mealId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/history");
  return { success: true };
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}
