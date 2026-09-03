"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/marketing/logo";
import { BottomNav } from "@/components/app/bottom-nav";
import { LogMealSheet } from "@/components/app/log-meal-sheet";
import { TimezoneSync } from "@/components/app/timezone-sync";
import { signOutAction } from "@/lib/actions/auth";

export function AppShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const [logOpen, setLogOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <TimezoneSync />
      <header className="sticky top-0 z-30 border-b border-ink-strong/10 bg-canvas/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-5">
          <Link href="/dashboard">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-ink-strong/70 sm:inline">
              {email}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex size-9 items-center justify-center rounded-full text-ink-strong/60 hover:bg-ink-strong/10 hover:text-ink-strong"
                aria-label="Sign out"
              >
                <LogOut className="size-4.5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pt-6 pb-28">
        {children}
      </main>

      <BottomNav onLog={() => setLogOpen(true)} />
      <LogMealSheet open={logOpen} onOpenChange={setLogOpen} />
    </div>
  );
}
