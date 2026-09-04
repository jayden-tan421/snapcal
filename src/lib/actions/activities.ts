"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type LogActivityState = { error?: string; success?: boolean } | null;

export async function logActivityAction(
  _prevState: LogActivityState,
  formData: FormData
): Promise<LogActivityState> {
  const activityDate = String(formData.get("activity_date") ?? "");
  const activityType = String(formData.get("activity_type") ?? "").trim();
  const durationMinutes = Number(formData.get("duration_minutes"));
  const caloriesBurned = Number(formData.get("calories_burned"));
  const notes = String(formData.get("notes") ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(activityDate)) {
    return { error: "Pick a valid date." };
  }
  if (!activityType) {
    return { error: "Choose what kind of activity this was." };
  }
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return { error: "Duration needs to be a positive number of minutes." };
  }
  if (!Number.isFinite(caloriesBurned) || caloriesBurned < 0) {
    return { error: "Calories burned can't be negative." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const { error } = await supabase.from("activities").insert({
    user_id: user.id,
    activity_date: activityDate,
    activity_type: activityType,
    duration_minutes: Math.round(durationMinutes),
    calories_burned: Math.round(caloriesBurned),
    notes: notes || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/history");
  return { success: true };
}

export async function deleteActivityAction(activityId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const { error } = await supabase
    .from("activities")
    .delete()
    .eq("id", activityId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/history");
  return { success: true as const };
}
