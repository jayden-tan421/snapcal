import { createClient } from "@/lib/supabase/server";
import type { CrossbetMetric, CrossbetStatus } from "@/lib/supabase/types";
import { getAcceptedConnections } from "@/lib/supabase/sharing-queries";

export interface CrossbetRow {
  id: string;
  metric: CrossbetMetric;
  start_date: string;
  end_date: string;
  stake_points: number;
  status: CrossbetStatus;
  winner_id: string | null;
  created_at: string;
  role: "creator" | "opponent";
  counterpart: { id: string; email: string } | null;
}

/** Every crossbet (any status) the user is a party to, newest first. */
export async function getCrossbets(userId: string): Promise<CrossbetRow[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("crossbets")
    .select(
      "id, creator_id, opponent_id, metric, start_date, end_date, stake_points, status, winner_id, created_at"
    )
    .or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error || !rows) return [];

  const counterpartIds = [
    ...new Set(rows.map((r) => (r.creator_id === userId ? r.opponent_id : r.creator_id))),
  ];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", counterpartIds);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return rows.map((r) => ({
    id: r.id,
    metric: r.metric,
    start_date: r.start_date,
    end_date: r.end_date,
    stake_points: r.stake_points,
    status: r.status,
    winner_id: r.winner_id,
    created_at: r.created_at,
    role: r.creator_id === userId ? "creator" : "opponent",
    counterpart:
      byId.get(r.creator_id === userId ? r.opponent_id : r.creator_id) ?? null,
  }));
}

export interface LeaderboardRow {
  id: string;
  email: string;
  leaderboard_points: number;
  is_you: boolean;
}

/** Ranks the current user plus everyone they have an accepted sharing
 * relationship with, by lifetime crossbet points won. */
export async function getLeaderboard(userId: string): Promise<LeaderboardRow[]> {
  const connections = await getAcceptedConnections(userId);
  const ids = [userId, ...connections.map((c) => c.id)];

  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, leaderboard_points")
    .in("id", ids);

  return (profiles ?? [])
    .map((p) => ({
      id: p.id,
      email: p.email,
      leaderboard_points: p.leaderboard_points,
      is_you: p.id === userId,
    }))
    .sort((a, b) => b.leaderboard_points - a.leaderboard_points);
}
