import type { Meal } from "@/lib/supabase/queries";
import { localDateKey, startOfLocalDay } from "@/lib/timezone";

export interface DayTotal {
  date: string; // yyyy-mm-dd, in the given timezone
  label: string; // short display label, e.g. "Mon"
  calories: number;
}

/** Buckets meals into local-day totals for the last `days` days (oldest → newest), including empty days. */
export function groupMealsByDay(
  meals: Meal[],
  days: number,
  timeZone: string
): DayTotal[] {
  // Must be formatted with the same `timeZone` as the bucketing below —
  // otherwise a UTC-offset instant can round to the wrong calendar day's
  // weekday name (e.g. right around midnight).
  const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone,
  });

  const buckets = new Map<string, number>();

  for (const meal of meals) {
    const key = localDateKey(new Date(meal.created_at), timeZone);
    buckets.set(key, (buckets.get(key) ?? 0) + meal.total_calories);
  }

  const result: DayTotal[] = [];
  const todayStart = startOfLocalDay(new Date(), timeZone);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
    const key = localDateKey(d, timeZone);
    result.push({
      date: key,
      label: weekdayFormatter.format(d),
      calories: Math.round(buckets.get(key) ?? 0),
    });
  }

  return result;
}
