"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Re-checks admin status server-side on every call — never trust that a
 * request reaching this action implies the caller is an admin, since a
 * Server Action is a public HTTP endpoint like any other.
 */
async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user) return { error: "You need to be logged in.", user: null } as const;

  const profile = await getProfile(user.id);
  if (!profile?.is_admin) {
    return { error: "You don't have permission to do that.", user: null } as const;
  }

  return { error: null, user } as const;
}

/**
 * Deletes another user's account entirely (auth user + cascaded profile,
 * meals, and sharing rows — same cascade deleteAccountAction relies on).
 * Uses the service-role client since only the admin API can delete an
 * auth.users row outright.
 */
export async function adminDeleteUserAction(targetUserId: string) {
  const { error, user } = await assertAdmin();
  if (error) return { error };

  if (targetUserId === user.id) {
    return {
      error: "You can't delete your own account from here — use Settings instead.",
    };
  }

  const admin = createAdminClient();
  const { error: deleteError } = await admin.auth.admin.deleteUser(targetUserId);
  if (deleteError) return { error: deleteError.message };

  revalidatePath("/admin");
  return { success: true as const };
}

/**
 * Grants or revokes admin access for another user. Goes through the
 * service-role client specifically so it clears the
 * "profiles_lock_admin_flag" trigger's service_role check (schema.sql) —
 * that trigger exists precisely to stop a non-admin flipping this via the
 * regular client, so it must stay blocked for everyone except this
 * already-admin-gated path.
 */
export async function adminSetAdminAction(targetUserId: string, makeAdmin: boolean) {
  const { error, user } = await assertAdmin();
  if (error) return { error };

  if (targetUserId === user.id && !makeAdmin) {
    return { error: "You can't remove your own admin access." };
  }

  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("profiles")
    .update({ is_admin: makeAdmin })
    .eq("id", targetUserId);
  if (updateError) return { error: updateError.message };

  revalidatePath("/admin");
  return { success: true as const };
}
