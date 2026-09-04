"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logActivityAction } from "@/lib/actions/activities";
import { ACTIVITY_TYPES, estimateCaloriesBurned } from "@/lib/activity-types";
import { playSound } from "@/lib/sound";

export function ActivityLogForm({ defaultDate }: { defaultDate: string }) {
  const [state, formAction, pending] = useActionState(logActivityAction, null);
  const [activityType, setActivityType] = useState(ACTIVITY_TYPES[0].value);
  const [duration, setDuration] = useState(30);
  const [calories, setCalories] = useState(() =>
    estimateCaloriesBurned(ACTIVITY_TYPES[0].value, 30)
  );
  const [caloriesTouched, setCaloriesTouched] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state.success) playSound("success");
    else if (state.error) playSound("error");
  }, [state]);

  function updateDuration(minutes: number) {
    setDuration(minutes);
    if (!caloriesTouched) setCalories(estimateCaloriesBurned(activityType, minutes));
  }

  function updateType(type: string) {
    setActivityType(type);
    if (!caloriesTouched) setCalories(estimateCaloriesBurned(type, duration));
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="activity_date">Date</Label>
        <Input
          id="activity_date"
          name="activity_date"
          type="date"
          defaultValue={defaultDate}
          max={defaultDate}
          required
          className="h-10 bg-ink/60"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="activity_type">Activity</Label>
        <Select name="activity_type" value={activityType} onValueChange={updateType}>
          <SelectTrigger id="activity_type" className="h-10 w-full bg-ink/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="duration_minutes">Duration (min)</Label>
          <Input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            inputMode="numeric"
            min={1}
            max={1440}
            value={duration}
            onChange={(e) => updateDuration(Number(e.target.value) || 0)}
            onFocus={(e) => e.target.select()}
            className="h-10 bg-ink/60"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="calories_burned">Calories burned</Label>
          <Input
            id="calories_burned"
            name="calories_burned"
            type="number"
            inputMode="numeric"
            min={0}
            value={calories}
            onChange={(e) => {
              setCaloriesTouched(true);
              setCalories(Number(e.target.value) || 0);
            }}
            onFocus={(e) => e.target.select()}
            className="h-10 bg-ink/60"
          />
        </div>
      </div>
      <p className="-mt-1.5 text-xs font-medium text-ink-strong/45">
        Calories burned auto-fills from duration — edit it if you know better.
      </p>

      {state?.error && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="h-10 w-fit rounded-full bg-element px-5 text-sm font-semibold text-ink hover:bg-element/90"
      >
        {pending ? "Logging…" : "Log activity"}
      </Button>
    </form>
  );
}
