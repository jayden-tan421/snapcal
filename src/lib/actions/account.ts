"use server";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * Permanently deletes the current user's account. Uses the admin
 * (service-role) client because a user can never delete their own
 * auth.users row through the regular client — Supabase only exposes that
 * via the admin API. Deleting the auth user cascades (via `on delete
 * cascade` foreign keys — see supabase/schema.sql) to remove their
 * profile, every meal they've logged, and every log_access row they're
 * part of (as either owner or viewer). There is no undo.
 */
export async function deleteAccountAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return { error: error.message };
  }

  // The auth user (and its session) is gone server-side; clear the local
  // session cookie too so the browser doesn't hang on to a dead token.
  await supabase.auth.signOut();
  redirect("/");
}
