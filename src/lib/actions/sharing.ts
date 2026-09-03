"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SharingState = { error?: string; success?: boolean } | null;

export async function inviteViewerAction(
  _prevState: SharingState,
  formData: FormData
): Promise<SharingState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Enter an email address." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  if (email === user.email?.toLowerCase()) {
    return { error: "You can't invite yourself." };
  }

  const { data: viewerId, error: lookupError } = await supabase.rpc(
    "find_user_id_by_email",
    { lookup_email: email }
  );

  if (lookupError) return { error: lookupError.message };
  if (!viewerId) {
    return {
      error: "No SnapCal account found for that email — they need to sign up first.",
    };
  }

  const { error } = await supabase
    .from("log_access")
    .insert({ owner_id: user.id, viewer_id: viewerId, status: "pending" });

  if (error) {
    if (error.code === "23505") {
      return { error: "You've already invited this person." };
    }
    return { error: error.message };
  }

  revalidatePath("/shared");
  return { success: true };
}

export async function respondToInviteAction(
  inviteId: string,
  accept: boolean
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const { error } = await supabase
    .from("log_access")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", inviteId)
    .eq("viewer_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/shared");
  return { success: true };
}

/** Owner revokes an invite/share they extended (any status). */
export async function revokeShareAction(inviteId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const { error } = await supabase
    .from("log_access")
    .delete()
    .eq("id", inviteId)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/shared");
  return { success: true };
}

/** Viewer leaves a share extended to them (any status). */
export async function leaveShareAction(inviteId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const { error } = await supabase
    .from("log_access")
    .update({ status: "declined" })
    .eq("id", inviteId)
    .eq("viewer_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/shared");
  return { success: true };
}
