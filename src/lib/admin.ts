import { redirect } from "next/navigation";
import { getCurrentUser, getProfile, type CurrentUser } from "@/lib/supabase/queries";

/**
 * Server-side gate for admin-only routes/actions. Never trust a client-sent
 * flag for this — always re-derive "is this user an admin?" from the
 * trusted-header user id (see getCurrentUser) plus a fresh DB read of
 * is_admin, which the "profiles_lock_admin_flag" trigger (schema.sql)
 * guarantees a regular user can never set on themselves.
 *
 * Redirects (rather than throwing) so it's safe to call directly from a
 * Server Component page.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile?.is_admin) redirect("/dashboard");

  return user;
}
