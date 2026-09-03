import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { signUpAction } from "@/lib/actions/auth";

export const metadata: Metadata = { title: "Sign up — SnapCal" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Free forever. Takes less than a minute."
    >
      <AuthForm mode="signup" action={signUpAction} />
    </AuthShell>
  );
}
