import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ArrowLeft } from "lucide-react";
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

export const metadata: Metadata = { title: "Shared log — SnapCal" };

export default async function SharedLogPage({
  params,
}: {
  params: Promise<{ ownerId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { ownerId } = await params;
  const timeZone = resolveTimezone((await cookies()).get("tz")?.value);
  const { startIso, endIso } = todayRange(timeZone);
  const today = todayDateKey(timeZone);

  // RLS enforces the real permission check: getProfile/getMeals only
  // return rows for ownerId if log_access has an accepted row for this
  // viewer. A null profile here means either the owner doesn't exist or
  // access hasn't been granted (or was revoked).
  const [profile, meals, burnedCalories] = await Promise.all([
    getProfile(ownerId),
    getMeals(ownerId, startIso, endIso),
    getBurnedCaloriesForDate(ownerId, today),
  ]);

  if (!profile) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="font-display text-lg font-semibold text-ink-strong">
          You don&apos;t have access to this log
        </p>
        <p className="max-w-xs text-sm font-medium text-ink-strong/60">
          The owner may not have accepted your request yet, or has revoked
          access.
        </p>
        <Link
          href="/shared"
          className="mt-2 text-sm font-semibold text-element hover:underline"
        >
          Back to Shared
        </Link>
      </div>
    );
  }

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
      <Link
        href="/shared"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-strong/60 hover:text-ink-strong"
      >
        <ArrowLeft className="size-4" /> Back to Shared
      </Link>
      <p className="mb-1 text-sm font-medium text-ink-strong/60">
        Viewing (read-only)
      </p>
      <h1 className="mb-4 font-display text-xl font-semibold text-ink-strong">
        {profile.email}&apos;s log — today
      </h1>

      <CalorieHero
        consumed={totals.calories}
        goal={profile.daily_calorie_goal}
        burned={burnedCalories}
      />
      <MacroRow
        protein_g={totals.protein_g}
        carbs_g={totals.carbs_g}
        fat_g={totals.fat_g}
      />
      <MealList meals={meals} timeZone={timeZone} readOnly />
    </div>
  );
}
