import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  getBurnedCaloriesForDate,
  getCurrentUser,
  getMeals,
  getProfile,
  todayDateKey,
  todayRange,
} from "@/lib/supabase/queries";
import { resolveTimezone } from "@/lib/timezone";
import { CalorieHero } from "@/components/app/calorie-hero";
import { MacroRow } from "@/components/app/macro-row";
import { MealList } from "@/components/app/meal-list";

export const metadata: Metadata = { title: "Today — SnapCal" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const timeZone = resolveTimezone((await cookies()).get("tz")?.value);
  const { startIso, endIso } = todayRange(timeZone);
  const today = todayDateKey(timeZone);

  const [profile, meals, burnedCalories] = await Promise.all([
    getProfile(user.id),
    getMeals(user.id, startIso, endIso),
    getBurnedCaloriesForDate(user.id, today),
  ]);

  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.total_calories,
      protein_g: acc.protein_g + meal.total_protein_g,
      carbs_g: acc.carbs_g + meal.total_carbs_g,
      fat_g: acc.fat_g + meal.total_fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-semibold text-ink-strong">
        Today
      </h1>
      <CalorieHero
        consumed={totals.calories}
        goal={profile?.daily_calorie_goal ?? 2000}
        burned={burnedCalories}
      />
      <MacroRow
        protein_g={totals.protein_g}
        carbs_g={totals.carbs_g}
        fat_g={totals.fat_g}
      />
      <MealList meals={meals} timeZone={timeZone} />
    </div>
  );
}
