import type { LeaderboardRow } from "@/lib/supabase/crossbet-queries";
import { cn } from "@/lib/utils";

export function Leaderboard({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length <= 1) {
    return (
      <p className="text-sm font-medium text-ink-strong/50">
        Share your log with someone (see the Shared tab) to start a
        leaderboard together.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {rows.map((row, i) => (
        <li
          key={row.id}
          className={cn(
            "flex items-center gap-3 rounded-2xl px-4 py-2.5",
            row.is_you ? "bg-element/10" : "bg-background/40"
          )}
        >
          <span className="w-5 shrink-0 text-center text-sm font-semibold text-ink-strong/50">
            {i + 1}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-strong">
            {row.email}
            {row.is_you && (
              <span className="ml-1.5 text-xs font-medium text-ink-strong/40">
                (you)
              </span>
            )}
          </span>
          <span className="shrink-0 text-sm font-semibold text-element">
            {row.leaderboard_points} pts
          </span>
        </li>
      ))}
    </ol>
  );
}
