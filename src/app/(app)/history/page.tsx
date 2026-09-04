import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  getCurrentUser,
  getMeals,
  getProfile,
  getActivities,
  currentMonthKey,
  todayDateKey,
} from "@/lib/supabase/queries";
import { groupMealsByDay } from "@/lib/aggregate";
import { resolveTimezone, formatDateKeyLabel } from "@/lib/timezone";
import { CalorieChart } from "@/components/app/calorie-chart";
import { ActivityCalendar } from "@/components/app/activity-calendar";
import { ActivityLogForm } from "@/components/app/activity-log-form";
import { ActivityList } from "@/components/app/activity-list";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "History — SnapCal" };

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; month?: string; day?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { tab: tabParam, month: monthParam, day: dayParam } = await searchParams;
  const tab = tabParam === "activity" ? "activity" : "meals";
  const timeZone = resolveTimezone((await cookies()).get("tz")?.value);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl font-semibold text-ink-strong">
        History
      </h1>

      <div className="flex gap-1 self-start rounded-full bg-card p-1">
        <TabLink href="?tab=meals" active={tab === "meals"}>
          Meals
        </TabLink>
        <TabLink href="?tab=activity" active={tab === "activity"}>
          Activity
        </TabLink>
      </div>

      {tab === "meals" ? (
        <MealsSection userId={user.id} timeZone={timeZone} />
      ) : (
        <ActivitySection
          userId={user.id}
          timeZone={timeZone}
          monthParam={monthParam}
          dayParam={dayParam}
        />
      )}
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
        active ? "bg-element text-ink" : "text-ink-strong/60 hover:text-ink-strong"
      )}
    >
      {children}
    </Link>
  );
}

async function MealsSection({
  userId,
  timeZone,
}: {
  userId: string;
  timeZone: string;
}) {
  // Fetch a slightly wider window than 30 days so the local-timezone day
  // bucketing below never gets clipped at the edges by a UTC-based fetch.
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 31);

  const [profile, meals] = await Promise.all([
    getProfile(userId),
    getMeals(userId, start.toISOString(), end.toISOString()),
  ]);

  const month = groupMealsByDay(meals, 30, timeZone);
  const week = month.slice(-7);
  const goal = profile?.daily_calorie_goal ?? 2000;

  const avgWeek = Math.round(
    week.reduce((sum, d) => sum + d.calories, 0) / week.length
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-ink-strong/60">
        7-day average: {avgWeek} kcal/day
      </p>
      <CalorieChart week={week} month={month} goal={goal} />
    </div>
  );
}

async function ActivitySection({
  userId,
  timeZone,
  monthParam,
  dayParam,
}: {
  userId: string;
  timeZone: string;
  monthParam?: string;
  dayParam?: string;
}) {
  const todayKey = todayDateKey(timeZone);
  const monthKey =
    monthParam && /^\d{4}-\d{2}$/.test(monthParam)
      ? monthParam
      : currentMonthKey(timeZone);

  const monthStartKey = `${monthKey}-01`;
  // Cheap way to get "last day of month" as a date key without pulling in
  // date-fns here: day 0 of "next month" is the last day of this one.
  const [y, m] = monthKey.split("-").map(Number);
  const monthEndKey = new Date(y, m, 0).toISOString().slice(0, 10);

  const activities = await getActivities(userId, monthStartKey, monthEndKey);
  const activityDates = new Set(activities.map((a) => a.activity_date));

  const selectedDay =
    dayParam && /^\d{4}-\d{2}-\d{2}$/.test(dayParam) && dayParam.slice(0, 7) === monthKey
      ? dayParam
      : undefined;

  const dayActivities = selectedDay
    ? activities.filter((a) => a.activity_date === selectedDay)
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl bg-card p-5">
        <ActivityCalendar
          monthKey={monthKey}
          selectedDay={selectedDay}
          todayKey={todayKey}
          activityDates={activityDates}
        />
      </div>

      {selectedDay ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl bg-card p-5">
            <ActivityLogForm date={selectedDay} dateLabel={formatDateKeyLabel(selectedDay)} />
          </div>
          {dayActivities.length > 0 && (
            <div className="rounded-3xl bg-card p-5">
              <h2 className="mb-3 font-display text-base font-semibold text-ink-strong">
                Already logged that day
              </h2>
              <ActivityList activities={dayActivities} />
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-sm font-medium text-ink-strong/50">
          Tap a day on the calendar to view or log activity.
        </p>
      )}
    </div>
  );
}
