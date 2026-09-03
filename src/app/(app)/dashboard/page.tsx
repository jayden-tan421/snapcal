import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  endOfTodayIso,
  getCurrentUser,
  getMeals,
  getProfile,
  startOfTodayIso,
} from "@/lib/supabase/queries";
import { CalorieHero } from "@/components/app/calorie-hero";
import { MacroRow } from "@/components/app/macro-row";
import { MealList } from "@/components/app/meal-list";

export const metadata: Metadata = { title: "Today — SnapCal" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, meals] = await Promise.all([
    getProfile(user.id),
    getMeals(user.id, startOfTodayIso(), endOfTodayIso()),
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
      <CalorieHero
        consumed={totals.calories}
        goal={profile?.daily_calorie_goal ?? 2000}
      />
      <MacroRow
        protein_g={totals.protein_g}
        carbs_g={totals.carbs_g}
        fat_g={totals.fat_g}
      />
      <MealList meals={meals} />
    </div>
  );
}
