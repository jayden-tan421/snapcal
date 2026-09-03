import type { Meal } from "@/lib/supabase/queries";

export interface DayTotal {
  date: string; // yyyy-mm-dd, local time
  label: string; // short display label, e.g. "Mon"
  calories: number;
}

/** Buckets meals into local-day totals for the last `days` days (oldest → newest), including empty days. */
export function groupMealsByDay(meals: Meal[], days: number): DayTotal[] {
  const buckets = new Map<string, number>();

  for (const meal of meals) {
    const key = localDateKey(new Date(meal.created_at));
    buckets.set(key, (buckets.get(key) ?? 0) + meal.total_calories);
  }

  const result: DayTotal[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = localDateKey(d);
    result.push({
      date: key,
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      calories: Math.round(buckets.get(key) ?? 0),
    });
  }

  return result;
}

function localDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
