import { createClient } from "@/lib/supabase/server";
import type { LogAccessStatus } from "@/lib/supabase/types";

export interface ShareRow {
  id: string;
  status: LogAccessStatus;
  created_at: string;
  counterpart: { id: string; email: string } | null;
}

/** Shares this user has extended to others, as the owner. */
export async function getOutgoingShares(ownerId: string): Promise<ShareRow[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("log_access")
    .select("id, viewer_id, status, created_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error || !rows) return [];
  return attachProfiles(rows, "viewer_id");
}

/** Shares extended to this user, as the viewer. */
export async function getIncomingShares(viewerId: string): Promise<ShareRow[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("log_access")
    .select("id, owner_id, status, created_at")
    .eq("viewer_id", viewerId)
    .order("created_at", { ascending: false });

  if (error || !rows) return [];
  return attachProfiles(rows, "owner_id");
}

/**
 * Everyone the user has an *accepted* sharing relationship with, in either
 * direction — the trust boundary crossbets and the leaderboard reuse
 * instead of inventing a new one (see crossbets' RLS insert policy).
 */
export async function getAcceptedConnections(
  userId: string
): Promise<{ id: string; email: string }[]> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("log_access")
    .select("owner_id, viewer_id")
    .eq("status", "accepted")
    .or(`owner_id.eq.${userId},viewer_id.eq.${userId}`);

  const ids = [
    ...new Set(
      (rows ?? []).map((r) => (r.owner_id === userId ? r.viewer_id : r.owner_id))
    ),
  ];
  if (ids.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", ids);

  return profiles ?? [];
}

async function attachProfiles(
  rows: Array<{
    id: string;
    status: LogAccessStatus;
    created_at: string;
    [key: string]: unknown;
  }>,
  idKey: "viewer_id" | "owner_id"
): Promise<ShareRow[]> {
  if (rows.length === 0) return [];
  const supabase = await createClient();
  const ids = [...new Set(rows.map((r) => r[idKey] as string))];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", ids);

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    created_at: r.created_at,
    counterpart: byId.get(r[idKey] as string) ?? null,
  }));
}
