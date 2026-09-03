"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateGoalAction(_prevState: unknown, formData: FormData) {
  const goal = Number(formData.get("daily_calorie_goal"));

  if (!Number.isFinite(goal) || goal < 500 || goal > 10000) {
    return { error: "Enter a calorie goal between 500 and 10,000." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const { error } = await supabase
    .from("profiles")
    .update({ daily_calorie_goal: Math.round(goal) })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { success: true };
}
