import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, getMeals, getProfile } from "@/lib/supabase/queries";
import { groupMealsByDay } from "@/lib/aggregate";
import { CalorieChart } from "@/components/app/calorie-chart";

export const metadata: Metadata = { title: "History — SnapCal" };

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);

  const [profile, meals] = await Promise.all([
    getProfile(user.id),
    getMeals(user.id, start.toISOString(), end.toISOString()),
  ]);

  const month = groupMealsByDay(meals, 30);
  const week = month.slice(-7);
  const goal = profile?.daily_calorie_goal ?? 2000;

  const avgWeek = Math.round(
    week.reduce((sum, d) => sum + d.calories, 0) / week.length
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-strong">
          History
        </h1>
        <p className="text-sm font-medium text-ink-strong/60">
          7-day average: {avgWeek} kcal/day
        </p>
      </div>
      <CalorieChart week={week} month={month} goal={goal} />
    </div>
  );
}
