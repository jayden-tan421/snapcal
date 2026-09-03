import { createClient } from "@/lib/supabase/server";
import type { MealItem } from "@/lib/supabase/types";
import { localDayRangeIso } from "@/lib/timezone";

export interface Meal {
  id: string;
  user_id: string;
  created_at: string;
  items: MealItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  notes: string | null;
  source: "ai" | "manual";
  confidence: "low" | "medium" | "high" | null;
}

export interface Profile {
  id: string;
  email: string;
  daily_calorie_goal: number;
}

/** Throws-free: returns null if there's no logged-in user. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, daily_calorie_goal")
    .eq("id", userId)
    .single();
  return data;
}

/**
 * Meals for a given owner within [startIso, endIso). Relies on RLS: this
 * will return rows for `ownerId` whether the caller IS ownerId or is a
 * viewer with accepted log_access — no extra permission check needed here.
 */
export async function getMeals(
  ownerId: string,
  startIso: string,
  endIso: string
): Promise<Meal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .eq("user_id", ownerId)
    .gte("created_at", startIso)
    .lt("created_at", endIso)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getMeals failed:", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * [startIso, endIso) for "today" in the visitor's local timezone (not the
 * server's — Vercel runs in UTC, which would silently misalign "today"
 * for almost every visitor otherwise). Pass the `tz` cookie value, read
 * server-side via `resolveTimezone(cookieStore.get("tz")?.value)`.
 */
export function todayRange(timeZone: string) {
  return localDayRangeIso(new Date(), timeZone);
}
