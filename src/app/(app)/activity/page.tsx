import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  getCurrentUser,
  getActivities,
  todayDateKey,
  dateKeyDaysAgo,
} from "@/lib/supabase/queries";
import { resolveTimezone } from "@/lib/timezone";
import { ActivityLogForm } from "@/components/app/activity-log-form";
import { ActivityList } from "@/components/app/activity-list";

export const metadata: Metadata = { title: "Activity — SnapCal" };

export default async function ActivityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const timeZone = resolveTimezone((await cookies()).get("tz")?.value);
  const today = todayDateKey(timeZone);
  const startDateKey = dateKeyDaysAgo(30, timeZone);

  const activities = await getActivities(user.id, startDateKey, today);
  const totalBurned = activities.reduce((sum, a) => sum + a.calories_burned, 0);
  const distinctDays = new Set(activities.map((a) => a.activity_date)).size;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-ink-strong">
        Activity
      </h1>

      <section className="rounded-3xl bg-card p-5">
        <h2 className="font-display text-lg font-semibold text-ink-strong">
          Log a sport day
        </h2>
        <p className="mt-1 text-sm font-medium text-ink-strong/60">
          Which day did you exercise, and roughly how much?
        </p>
        <div className="mt-4">
          <ActivityLogForm defaultDate={today} />
        </div>
      </section>

      <section className="rounded-3xl bg-card p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-ink-strong">
            Last 30 days
          </h2>
          <span className="shrink-0 text-xs font-medium text-ink-strong/50">
            {distinctDays} active day{distinctDays === 1 ? "" : "s"} ·{" "}
            {Math.round(totalBurned)} kcal burned
          </span>
        </div>
        <div className="mt-4">
          <ActivityList activities={activities} />
        </div>
      </section>
    </div>
  );
}
