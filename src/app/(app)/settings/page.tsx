import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import { GoalForm } from "@/components/app/goal-form";
import { DeleteAccountDialog } from "@/components/app/delete-account-dialog";
import { SoundToggle } from "@/components/app/sound-toggle";

export const metadata: Metadata = { title: "Settings — SnapCal" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl font-semibold text-ink-strong">
        Settings
      </h1>

      <div className="rounded-3xl bg-card p-5">
        <p className="text-xs font-medium text-ink-strong/50">Signed in as</p>
        <p className="mt-0.5 text-sm font-semibold text-ink-strong">
          {profile?.email ?? user.email}
        </p>
      </div>

      <div className="rounded-3xl bg-card p-5">
        <h2 className="font-display text-lg font-semibold text-ink-strong">
          Goal
        </h2>
        <p className="mt-1 text-sm font-medium text-ink-strong/60">
          Your dashboard compares today&apos;s total against this.
        </p>
        <div className="mt-4">
          <GoalForm initialGoal={profile?.daily_calorie_goal ?? 2000} />
        </div>
      </div>

      <Link
        href="/shared"
        className="flex items-center gap-3 rounded-3xl bg-card p-5"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-element/10 text-element">
          <Users className="size-5" />
        </span>
        <span>
          <span className="block font-display text-base font-semibold text-ink-strong">
            Sharing
          </span>
          <span className="block text-sm font-medium text-ink-strong/60">
            Manage who can view your log
          </span>
        </span>
      </Link>

      <SoundToggle />

      <DeleteAccountDialog />
    </div>
  );
}
