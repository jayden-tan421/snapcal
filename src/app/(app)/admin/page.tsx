import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";
import { AdminUserList, type AdminUserRow } from "@/components/app/admin-user-list";

export const metadata: Metadata = { title: "Admin — SnapCal" };

export default async function AdminPage() {
  const currentUser = await requireAdmin();

  // Service-role client: this deliberately bypasses RLS to list every
  // user's profile, which is exactly what an admin screen needs and why
  // this page itself is gated by requireAdmin() above rather than RLS.
  const admin = createAdminClient();
  const { data: users, error } = await admin
    .from("profiles")
    .select("id, email, daily_calorie_goal, is_admin, created_at")
    .order("created_at", { ascending: false })
    .returns<AdminUserRow[]>();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-strong">
          Admin
        </h1>
        <p className="mt-1 text-sm font-medium text-ink-strong/60">
          {users?.length ?? 0} registered user{users?.length === 1 ? "" : "s"}
        </p>
      </div>

      {error && (
        <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          Couldn&apos;t load users: {error.message}
        </p>
      )}

      {users && <AdminUserList users={users} currentUserId={currentUser.id} />}
    </div>
  );
}
