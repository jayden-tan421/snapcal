import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { signInAction } from "@/lib/actions/auth";

export const metadata: Metadata = { title: "Log in — SnapCal" };

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Log in to keep your streak going.">
      <AuthForm mode="login" action={signInAction} />
    </AuthShell>
  );
}
