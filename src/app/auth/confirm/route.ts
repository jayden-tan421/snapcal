import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles the link Supabase emails for signup confirmation / magic links.
 * signUpAction() passes `emailRedirectTo` pointing back here using the
 * actual request origin, but Supabase will only honor it if that origin is
 * also listed in Authentication → URL Configuration → Redirect URLs
 * (otherwise it silently falls back to the dashboard's Site URL). Exchanges
 * the OTP token for a session, then sends the user into the app.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    }
  }

  redirect("/login?error=confirmation-failed");
}
