import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck, Users } from "lucide-react";
import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import { GoalForm } from "@/components/app/goal-form";
import { DeleteAccountDialog } from "@/components/app/delete-account-dialog";
import { SoundToggle } from "@/components/app/sound-toggle";
import { NavCardLink } from "@/components/app/nav-card-link";

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

      <NavCardLink
        href="/shared"
        icon={<Users className="size-5" />}
        title="Sharing"
        description="Manage who can view your log"
      />

      {profile?.is_admin && (
        <NavCardLink
          href="/admin"
          icon={<ShieldCheck className="size-5" />}
          title="Admin"
          description="Manage or delete user accounts"
        />
      )}

      <SoundToggle />

      <DeleteAccountDialog />
    </div>
  );
}
