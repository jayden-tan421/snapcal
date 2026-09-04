"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { playSound } from "@/lib/sound";
import type { CrossbetRow } from "@/lib/supabase/crossbet-queries";
import {
  respondToCrossbetAction,
  withdrawCrossbetAction,
} from "@/lib/actions/crossbets";

const METRIC_LABEL: Record<string, string> = {
  sports_days: "Most sports days",
  goal_days: "Most days within goal",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  active: "Active",
  completed: "Completed",
  declined: "Declined",
};

export function CrossbetList({
  rows,
  currentUserId,
}: {
  rows: CrossbetRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ error?: string } | undefined>) {
    startTransition(async () => {
      const result = await action();
      if (result?.error) {
        toast.error(result.error);
        playSound("error");
        return;
      }
      playSound("success");
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm font-medium text-ink-strong/50">
        No crossbets yet — challenge someone above.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => {
        const won = row.status === "completed" && row.winner_id === currentUserId;
        const lost =
          row.status === "completed" &&
          row.winner_id !== null &&
          row.winner_id !== currentUserId;

        return (
          <li
            key={row.id}
            className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-strong">
                vs {row.counterpart?.email ?? "Unknown user"}
              </p>
              <p className="text-xs font-medium text-ink-strong/50">
                {METRIC_LABEL[row.metric]} · {row.start_date} → {row.end_date} ·{" "}
                {row.stake_points} pts
              </p>
              <span
                className={cn(
                  "mt-1 inline-block text-xs font-semibold",
                  row.status === "active" && "text-element",
                  row.status === "pending" && "text-ink-strong/50",
                  row.status === "declined" && "text-ink-strong/35",
                  won && "text-element",
                  lost && "text-destructive",
                  row.status === "completed" && !row.winner_id && "text-ink-strong/50"
                )}
              >
                {row.status === "completed"
                  ? won
                    ? `Won +${row.stake_points} pts`
                    : lost
                      ? "Lost"
                      : "Tied — no points"
                  : STATUS_LABEL[row.status]}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {row.role === "opponent" && row.status === "pending" && (
                <>
                  <IconButton
                    label="Accept"
                    onClick={() => run(() => respondToCrossbetAction(row.id, true))}
                    disabled={isPending}
                  >
                    <Check className="size-4" />
                  </IconButton>
                  <IconButton
                    label="Decline"
                    onClick={() => run(() => respondToCrossbetAction(row.id, false))}
                    disabled={isPending}
                    destructive
                  >
                    <X className="size-4" />
                  </IconButton>
                </>
              )}
              {row.role === "creator" && row.status === "pending" && (
                <IconButton
                  label="Withdraw"
                  onClick={() => run(() => withdrawCrossbetAction(row.id))}
                  disabled={isPending}
                  destructive
                >
                  <Trash2 className="size-4" />
                </IconButton>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  destructive,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex size-8 items-center justify-center rounded-full transition-colors disabled:opacity-40",
        destructive
          ? "text-ink-strong/40 hover:bg-destructive/10 hover:text-destructive"
          : "text-ink-strong/40 hover:bg-element/10 hover:text-element"
      )}
    >
      {children}
    </button>
  );
}
