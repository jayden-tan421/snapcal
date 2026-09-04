"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CrossbetMetric, Database } from "@/lib/supabase/types";

export type CrossbetActionState = { error?: string; success?: boolean } | null;

export async function createCrossbetAction(
  _prevState: CrossbetActionState,
  formData: FormData
): Promise<CrossbetActionState> {
  const opponentId = String(formData.get("opponent_id") ?? "");
  const metric = String(formData.get("metric") ?? "");
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  const stakePoints = Number(formData.get("stake_points"));

  if (!opponentId) return { error: "Pick who you're challenging." };
  if (metric !== "sports_days" && metric !== "goal_days") {
    return { error: "Pick what you're competing on." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return { error: "Pick valid start and end dates." };
  }
  if (endDate <= startDate) {
    return { error: "End date needs to be after the start date." };
  }
  if (!Number.isFinite(stakePoints) || stakePoints <= 0) {
    return { error: "Stake needs to be a positive number of points." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  if (opponentId === user.id) {
    return { error: "You can't crossbet against yourself." };
  }

  const { error } = await supabase.from("crossbets").insert({
    creator_id: user.id,
    opponent_id: opponentId,
    metric: metric as CrossbetMetric,
    start_date: startDate,
    end_date: endDate,
    stake_points: Math.round(stakePoints),
  });

  if (error) {
    // RLS rejects this insert (Postgres "insufficient_privilege") when
    // there's no accepted share with the chosen opponent yet.
    if (error.code === "42501") {
      return {
        error: "You can only crossbet with someone you've got an accepted share with.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/crossbet");
  return { success: true };
}

export async function respondToCrossbetAction(crossbetId: string, accept: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const { error } = await supabase
    .from("crossbets")
    .update({ status: accept ? "active" : "declined" })
    .eq("id", crossbetId)
    .eq("opponent_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/crossbet");
  return { success: true as const };
}

/** Creator withdraws a challenge before the opponent has responded. */
export async function withdrawCrossbetAction(crossbetId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const { error } = await supabase
    .from("crossbets")
    .delete()
    .eq("id", crossbetId)
    .eq("creator_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/crossbet");
  return { success: true as const };
}

type AdminClient = SupabaseClient<Database>;

/** Distinct activity_date count within [startDate, endDate] — activities
 * are logged with a plain local date already, no timezone math needed. */
async function countSportsDays(
  admin: AdminClient,
  userId: string,
  startDate: string,
  endDate: string
): Promise<number> {
  const { data } = await admin
    .from("activities")
    .select("activity_date")
    .eq("user_id", userId)
    .gte("activity_date", startDate)
    .lte("activity_date", endDate);

  return new Set((data ?? []).map((r) => r.activity_date)).size;
}

/** Count of calendar days within [startDate, endDate] whose total logged
 * calories stayed at or under the goal. Groups meals by UTC calendar day
 * rather than each player's own local day — unlike the dashboard's
 * "today", a multi-day crossbet's outcome isn't sensitive to the rare meal
 * landing on the "wrong" day right at midnight, so this deliberately
 * simpler rule (no per-user timezone stored server-side) is an acceptable
 * trade-off here. */
async function countGoalDays(
  admin: AdminClient,
  userId: string,
  startDate: string,
  endDate: string,
  dailyGoal: number
): Promise<number> {
  const startIso = `${startDate}T00:00:00.000Z`;
  const endExclusiveIso = new Date(
    new Date(`${endDate}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000
  ).toISOString();

  const { data } = await admin
    .from("meals")
    .select("created_at, total_calories")
    .eq("user_id", userId)
    .gte("created_at", startIso)
    .lt("created_at", endExclusiveIso);

  const byDate = new Map<string, number>();
  for (const row of data ?? []) {
    const dateKey = row.created_at.slice(0, 10);
    byDate.set(dateKey, (byDate.get(dateKey) ?? 0) + row.total_calories);
  }

  let count = 0;
  for (const total of byDate.values()) {
    if (total <= dailyGoal) count++;
  }
  return count;
}

/**
 * Resolves any of the current user's crossbets whose end_date has passed.
 * Called at the top of the crossbet page's load — there's no persistent
 * background job in this deployment, so resolution happens lazily on
 * whichever page view first notices a bet is due, for either player.
 * Idempotent: only touches rows still in 'active' status.
 *
 * Uses the admin (service-role) client deliberately — resolving a bet
 * needs to read BOTH players' data, and log_access sharing can be
 * one-directional, so the regular RLS-scoped client can't always see the
 * opponent's side. The crossbets_lock_resolution trigger (schema.sql)
 * ensures only this service-role path can ever set status='completed' or
 * change winner_id.
 */
export async function resolveDueCrossbets(userId: string): Promise<void> {
  const supabase = await createClient();
  const todayIso = new Date().toISOString().slice(0, 10);

  const { data: due } = await supabase
    .from("crossbets")
    .select("id, creator_id, opponent_id, metric, start_date, end_date, stake_points")
    .eq("status", "active")
    .or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
    .lte("end_date", todayIso);

  if (!due || due.length === 0) return;

  const admin = createAdminClient();

  for (const bet of due) {
    let creatorCount: number;
    let opponentCount: number;

    if (bet.metric === "sports_days") {
      [creatorCount, opponentCount] = await Promise.all([
        countSportsDays(admin, bet.creator_id, bet.start_date, bet.end_date),
        countSportsDays(admin, bet.opponent_id, bet.start_date, bet.end_date),
      ]);
    } else {
      const [creatorProfile, opponentProfile] = await Promise.all([
        admin.from("profiles").select("daily_calorie_goal").eq("id", bet.creator_id).single(),
        admin.from("profiles").select("daily_calorie_goal").eq("id", bet.opponent_id).single(),
      ]);
      [creatorCount, opponentCount] = await Promise.all([
        countGoalDays(
          admin,
          bet.creator_id,
          bet.start_date,
          bet.end_date,
          creatorProfile.data?.daily_calorie_goal ?? 2000
        ),
        countGoalDays(
          admin,
          bet.opponent_id,
          bet.start_date,
          bet.end_date,
          opponentProfile.data?.daily_calorie_goal ?? 2000
        ),
      ]);
    }

    // Higher count wins; an exact tie is a push — nobody gains points.
    const winnerId =
      creatorCount > opponentCount
        ? bet.creator_id
        : opponentCount > creatorCount
          ? bet.opponent_id
          : null;

    await admin
      .from("crossbets")
      .update({ status: "completed", winner_id: winnerId })
      .eq("id", bet.id);

    if (winnerId) {
      const { data: winnerProfile } = await admin
        .from("profiles")
        .select("leaderboard_points")
        .eq("id", winnerId)
        .single();
      const current = winnerProfile?.leaderboard_points ?? 0;
      await admin
        .from("profiles")
        .update({ leaderboard_points: current + bet.stake_points })
        .eq("id", winnerId);
    }
  }

  revalidatePath("/crossbet");
  revalidatePath("/settings");
}
