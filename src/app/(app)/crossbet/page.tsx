import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { getAcceptedConnections } from "@/lib/supabase/sharing-queries";
import { getCrossbets, getLeaderboard } from "@/lib/supabase/crossbet-queries";
import { resolveDueCrossbets } from "@/lib/actions/crossbets";
import { Leaderboard } from "@/components/app/leaderboard";
import { CrossbetList } from "@/components/app/crossbet-list";
import { NewCrossbetForm } from "@/components/app/new-crossbet-form";

export const metadata: Metadata = { title: "Crossbet — SnapCal" };

export default async function CrossbetPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Lazily resolve any of this user's bets whose end_date has already
  // passed, before reading crossbets/leaderboard below — there's no
  // persistent background job in this deployment, so whichever player's
  // page load notices a bet is due is the one that triggers resolution.
  await resolveDueCrossbets(user.id);

  const [connections, crossbets, leaderboard] = await Promise.all([
    getAcceptedConnections(user.id),
    getCrossbets(user.id),
    getLeaderboard(user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-ink-strong">
        Crossbet
      </h1>

      <section className="rounded-3xl bg-card p-5">
        <h2 className="font-display text-lg font-semibold text-ink-strong">
          Leaderboard
        </h2>
        <p className="mt-1 text-sm font-medium text-ink-strong/60">
          Ranked by crossbet points won.
        </p>
        <div className="mt-4">
          <Leaderboard rows={leaderboard} />
        </div>
      </section>

      <section className="rounded-3xl bg-card p-5">
        <h2 className="font-display text-lg font-semibold text-ink-strong">
          New crossbet
        </h2>
        <p className="mt-1 text-sm font-medium text-ink-strong/60">
          {connections.length === 0
            ? "Share your log with someone first (see the Shared tab) before you can crossbet with them."
            : "Challenge someone you're sharing with — stake points, they have to accept."}
        </p>
        {connections.length > 0 && (
          <div className="mt-4">
            <NewCrossbetForm connections={connections} />
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-card p-5">
        <h2 className="font-display text-lg font-semibold text-ink-strong">
          Your crossbets
        </h2>
        <div className="mt-4">
          <CrossbetList rows={crossbets} currentUserId={user.id} />
        </div>
      </section>
    </div>
  );
}
