"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateGoalAction } from "@/lib/actions/settings";

export function GoalForm({ initialGoal }: { initialGoal: number }) {
  const [state, formAction, pending] = useActionState(updateGoalAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Label htmlFor="daily_calorie_goal">Daily calorie goal</Label>
      <div className="flex items-center gap-2">
        <Input
          id="daily_calorie_goal"
          name="daily_calorie_goal"
          type="number"
          inputMode="numeric"
          min={500}
          max={10000}
          step={50}
          defaultValue={initialGoal}
          className="h-11 max-w-40 bg-ink/60 text-base"
        />
        <span className="text-sm font-medium text-ink-strong/60">kcal / day</span>
      </div>

      {state && "error" in state && state.error && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}
      {state && "success" in state && state.success && (
        <p className="text-sm font-medium text-element">Saved.</p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="h-10 w-fit rounded-full bg-element px-5 text-sm font-semibold text-ink hover:bg-element/90"
      >
        {pending ? "Saving…" : "Save goal"}
      </Button>
    </form>
  );
}
