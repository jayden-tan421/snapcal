import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { getAcceptedConnections } from "@/lib/supabase/sharing-queries";
import { getCrossbets, getLeaderboard } from "@/lib/supabase/crossbet-queries";
import { resolveDueCrossbets } from "@/lib/actions/crossbets";
import { Leaderboard } from "@/components/app/leaderboard";
import { CrossbetList } from "@/components/app/crossbet-list";
import { NewCrossbetForm } from "@/components/app/new-crossbet-form";
import { CollapsibleSection } from "@/components/app/collapsible-section";

export const metadata: Metadata = { title: "Leaderboard — SnapCal" };

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

  const pendingForYou = crossbets.filter(
    (c) => c.role === "opponent" && c.status === "pending"
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-ink-strong">
        Leaderboard
      </h1>

      <section className="rounded-3xl bg-card p-5">
        <p className="text-sm font-medium text-ink-strong/60">
          Ranked by crossbet points won — points only, no real money.
        </p>
        <div className="mt-4">
          <Leaderboard rows={leaderboard} />
        </div>
      </section>

      {pendingForYou.length > 0 && (
        <section className="rounded-3xl bg-element/10 p-5">
          <h2 className="font-display text-base font-semibold text-ink-strong">
            Waiting on you
          </h2>
          <p className="mt-1 text-sm font-medium text-ink-strong/60">
            {pendingForYou.length} challenge
            {pendingForYou.length === 1 ? "" : "s"} to accept or decline.
          </p>
          <div className="mt-4">
            <CrossbetList rows={pendingForYou} currentUserId={user.id} />
          </div>
        </section>
      )}

      <section className="rounded-3xl bg-card p-5">
        <h2 className="font-display text-lg font-semibold text-ink-strong">
          Crossbets
        </h2>

        {connections.length === 0 ? (
          <p className="mt-1 text-sm font-medium text-ink-strong/60">
            Share your log with someone first (Settings → Sharing) before you
            can challenge them.
          </p>
        ) : (
          <div className="mt-4">
            <CollapsibleSection label="New crossbet">
              <NewCrossbetForm connections={connections} />
            </CollapsibleSection>
          </div>
        )}

        <div className="mt-4">
          <CrossbetList
            rows={crossbets.filter((c) => !pendingForYou.includes(c))}
            currentUserId={user.id}
          />
        </div>
      </section>
    </div>
  );
}
