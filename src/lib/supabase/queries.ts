import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { MealItem } from "@/lib/supabase/types";
import { localDayRangeIso, localDateKey } from "@/lib/timezone";

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
  is_admin: boolean;
  leaderboard_points: number;
}

export interface Activity {
  id: string;
  user_id: string;
  activity_date: string;
  activity_type: string;
  duration_minutes: number;
  calories_burned: number;
  notes: string | null;
  created_at: string;
}

export interface CurrentUser {
  id: string;
  email: string;
}

/**
 * Reads the already-validated user forwarded by middleware via trusted
 * request headers (see updateSession in supabase/middleware.ts) instead of
 * calling supabase.auth.getUser() again here — that would be a second
 * network round-trip to Supabase's auth server on every single page,
 * on top of the one middleware already does, roughly doubling the auth
 * check latency on every navigation.
 *
 * Throws-free: returns null if there's no logged-in user.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const h = await headers();
  const id = h.get("x-user-id");
  if (!id) return null;
  return { id, email: h.get("x-user-email") ?? "" };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, daily_calorie_goal, is_admin, leaderboard_points")
    .eq("id", userId)
    .single();

  // This used to swallow the error entirely, which silently degraded every
  // profile-dependent page (Settings' displayed goal, the dashboard's goal,
  // the admin/leaderboard checks) to hardcoded fallbacks with zero signal
  // as to why — e.g. a schema migration not yet applied made saving a goal
  // look broken when it was actually the *read* silently failing. Logging
  // at least makes that diagnosable from Vercel's function logs.
  if (error) {
    console.error("getProfile failed:", error.message);
    return null;
  }
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

/** "YYYY-MM-DD" for today in the visitor's local timezone — see todayRange. */
export function todayDateKey(timeZone: string): string {
  return localDateKey(new Date(), timeZone);
}

/**
 * "YYYY-MM-DD" for `daysAgo` days before today, in the visitor's local
 * timezone — for windowed queries like "last 30 days of activity". A
 * standalone helper (rather than inlining `new Date(Date.now() - ...)`
 * inside a page component) because the impure Date call needs to live
 * outside component-render code per the react-hooks/purity lint rule —
 * same reason todayDateKey/todayRange are helpers and not inlined either.
 */
export function dateKeyDaysAgo(daysAgo: number, timeZone: string): string {
  return localDateKey(new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000), timeZone);
}

/** "YYYY-MM" for the current month in the visitor's local timezone — the
 * activity calendar's default month when none is picked via ?month=. */
export function currentMonthKey(timeZone: string): string {
  return todayDateKey(timeZone).slice(0, 7);
}

/**
 * Activities for a given owner within [startDateKey, endDateKey] (both
 * inclusive — activity_date is a plain date, not a timestamp). Relies on
 * RLS the same way getMeals does: works for the owner or an accepted
 * viewer without any extra permission check here.
 */
export async function getActivities(
  ownerId: string,
  startDateKey: string,
  endDateKey: string
): Promise<Activity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", ownerId)
    .gte("activity_date", startDateKey)
    .lte("activity_date", endDateKey)
    .order("activity_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getActivities failed:", error.message);
    return [];
  }
  return data ?? [];
}

/** Total calories_burned logged for one specific local day. */
export async function getBurnedCaloriesForDate(
  ownerId: string,
  dateKey: string
): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("calories_burned")
    .eq("user_id", ownerId)
    .eq("activity_date", dateKey);

  if (error || !data) return 0;
  return data.reduce((sum, row) => sum + row.calories_burned, 0);
}
