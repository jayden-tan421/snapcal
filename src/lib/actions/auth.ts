"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string } | null;

/**
 * Builds the origin (protocol + host) the current request actually came
 * in on. Used for the signup confirmation email's redirect link, so it
 * points at whichever deployment sent it — localhost in dev, the real
 * domain in production — rather than whatever "Site URL" happens to be
 * configured in the Supabase dashboard (which defaults to localhost and
 * is easy to forget to update after deploying).
 *
 * NOTE: the target URL still has to be added to Supabase's Authentication
 * → URL Configuration → Redirect URLs allow-list, or Supabase will reject
 * it and fall back to the dashboard's Site URL regardless of what we pass
 * here — this only controls what link we *ask* Supabase to use.
 */
async function currentOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function friendlyError(message: string) {
  if (/invalid login credentials/i.test(message)) {
    return "That email or password doesn't match an account.";
  }
  if (/user already registered/i.test(message)) {
    return "An account with that email already exists — try logging in instead.";
  }
  if (/password should be at least/i.test(message)) {
    return "Password needs to be at least 6 characters.";
  }
  return message;
}

export async function signInAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: friendlyError(error.message) };
  }

  redirect("/dashboard");
}

export async function signUpAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }
  if (password.length < 6) {
    return { error: "Password needs to be at least 6 characters." };
  }

  const supabase = await createClient();
  const origin = await currentOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });

  if (error) {
    return { error: friendlyError(error.message) };
  }

  if (!data.session) {
    return {
      message:
        "Check your email to confirm your account, then come back and log in.",
    };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
