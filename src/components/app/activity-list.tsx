"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { Activity } from "@/lib/supabase/queries";
import { activityTypeLabel } from "@/lib/activity-types";
import { deleteActivityAction } from "@/lib/actions/activities";
import { playSound } from "@/lib/sound";

export function ActivityList({ activities }: { activities: Activity[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteActivityAction(id);
      if (result?.error) {
        toast.error(result.error);
        playSound("error");
        return;
      }
      router.refresh();
    });
  }

  if (activities.length === 0) {
    return (
      <p className="text-sm font-medium text-ink-strong/50">
        No activities logged in this range yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {activities.map((a) => (
        <li
          key={a.id}
          className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-strong">
              {activityTypeLabel(a.activity_type)}
            </p>
            <p className="text-xs font-medium text-ink-strong/50">
              {a.activity_date} · {a.duration_minutes} min ·{" "}
              {Math.round(a.calories_burned)} kcal burned
            </p>
            {a.notes && (
              <p className="mt-0.5 text-xs text-ink-strong/60">{a.notes}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Delete activity"
            onClick={() => handleDelete(a.id)}
            disabled={isPending}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-ink-strong/40 hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
          >
            <Trash2 className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
