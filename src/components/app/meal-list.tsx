"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Trash2 } from "lucide-react";
import { deleteMealAction } from "@/lib/actions/meals";
import type { Meal } from "@/lib/supabase/queries";

export function MealList({
  meals,
  readOnly = false,
  timeZone = "UTC",
}: {
  meals: Meal[];
  readOnly?: boolean;
  /**
   * Must be passed explicitly (from the same cookie-resolved timezone used
   * for day-boundary math) rather than left to the runtime's local zone.
   * This component server-renders for the initial HTML and then hydrates
   * client-side; if `toLocaleTimeString` relied on the runtime's implicit
   * timezone, the server (UTC on Vercel) and the visitor's browser would
   * format the same timestamp differently, causing a React hydration
   * mismatch (and visibly wrong times) for any non-UTC visitor.
   */
  timeZone?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteMealAction(id);
      if (result.error) {
        toast.error("Couldn't delete that meal", { description: result.error });
        return;
      }
      router.refresh();
    });
  }

  if (meals.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-ink-strong/20 px-4 py-8 text-center">
        <p className="text-sm font-medium text-ink-strong/60">
          Nothing logged yet today.
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-6 flex flex-col gap-2.5">
      {meals.map((meal) => {
        const title =
          meal.items.map((i) => i.name).join(", ") || "Untitled meal";
        const time = new Date(meal.created_at).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          timeZone,
        });

        return (
          <li
            key={meal.id}
            className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {meal.source === "ai" && (
                  <Sparkles className="size-3.5 shrink-0 text-element" />
                )}
                <p className="truncate text-sm font-semibold text-ink-strong">
                  {title}
                </p>
              </div>
              <p className="text-xs font-medium text-ink-strong/55">
                {time}
                {meal.notes ? ` · ${meal.notes}` : ""}
              </p>
            </div>
            <p className="shrink-0 font-display text-base font-semibold text-ink-strong">
              {Math.round(meal.total_calories)}
              <span className="text-xs font-medium text-ink-strong/50">
                {" "}
                kcal
              </span>
            </p>
            {!readOnly && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDelete(meal.id)}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-ink-strong/40 hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                aria-label="Delete meal"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
