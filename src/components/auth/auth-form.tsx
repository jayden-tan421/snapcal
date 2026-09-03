"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthState } from "@/lib/actions/auth";
import { playSound } from "@/lib/sound";

export function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "signup";
  action: (prevState: AuthState, formData: FormData) => Promise<AuthState>;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    null
  );

  useEffect(() => {
    if (!state) return;
    // A successful login/signup redirects away before state ever updates,
    // so anything we see here is either an error or the signup
    // check-your-email message — both worth a sound, one negative and one
    // positive.
    if (state.error) playSound("error");
    else if (state.message) playSound("success");
  }, [state]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          className="h-11 bg-ink/60 px-3.5 text-base"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder="••••••••"
          required
          minLength={6}
          className="h-11 bg-ink/60 px-3.5 text-base"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}
      {state?.message && (
        <p className="rounded-lg bg-element/10 px-3 py-2 text-sm font-medium text-ink-strong">
          {state.message}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-full bg-element text-base font-semibold text-ink shadow-[0_3px_0_0_rgba(0,0,0,0.18)] hover:bg-element/90 active:translate-y-0.5 active:shadow-[0_1px_0_0_rgba(0,0,0,0.18)]"
      >
        {pending
          ? "Please wait…"
          : mode === "login"
            ? "Log in"
            : "Create account"}
      </Button>

      <p className="text-center text-sm font-medium text-ink-strong/70">
        {mode === "login" ? (
          <>
            New to SnapCal?{" "}
            <Link href="/signup" className="text-element hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-element hover:underline">
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
