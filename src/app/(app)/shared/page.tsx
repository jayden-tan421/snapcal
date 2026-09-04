import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { getIncomingShares, getOutgoingShares } from "@/lib/supabase/sharing-queries";
import { InviteForm } from "@/components/app/invite-form";
import { ShareList } from "@/components/app/share-list";

export const metadata: Metadata = { title: "Sharing — SnapCal" };

export default async function SharedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [outgoing, incoming] = await Promise.all([
    getOutgoingShares(user.id),
    getIncomingShares(user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-strong">
          Sharing
        </h1>
        <p className="mt-1 text-sm font-medium text-ink-strong/60">
          Once someone accepts, you&apos;ll both show up as options on each
          other&apos;s Leaderboard tab too.
        </p>
      </div>

      <section className="rounded-3xl bg-card p-5">
        <h2 className="font-display text-lg font-semibold text-ink-strong">
          Shared with me
        </h2>
        <p className="mt-1 text-sm font-medium text-ink-strong/60">
          Logs other people have invited you to view.
        </p>
        <div className="mt-4">
          <ShareList rows={incoming} role="viewer" />
        </div>
      </section>

      <section className="rounded-3xl bg-card p-5">
        <h2 className="font-display text-lg font-semibold text-ink-strong">
          My log — shared with
        </h2>
        <p className="mt-1 text-sm font-medium text-ink-strong/60">
          Invite a coach, partner, or accountability buddy. They get
          view-only access until you revoke it.
        </p>
        <div className="mt-4">
          <InviteForm />
        </div>
        <div className="mt-4">
          <ShareList rows={outgoing} role="owner" />
        </div>
      </section>
    </div>
  );
}
