"use client";

import { useActionState, useEffect } from "react";
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
import { createCrossbetAction } from "@/lib/actions/crossbets";
import { playSound } from "@/lib/sound";

export function NewCrossbetForm({
  connections,
}: {
  connections: { id: string; email: string }[];
}) {
  const [state, formAction, pending] = useActionState(createCrossbetAction, null);

  useEffect(() => {
    if (!state) return;
    if (state.success) playSound("success");
    else if (state.error) playSound("error");
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="opponent_id">Challenge</Label>
        <Select name="opponent_id" defaultValue={connections[0]?.id}>
          <SelectTrigger id="opponent_id" className="h-10 w-full bg-ink/60">
            <SelectValue placeholder="Pick someone" />
          </SelectTrigger>
          <SelectContent>
            {connections.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="metric">On</Label>
        <Select name="metric" defaultValue="sports_days">
          <SelectTrigger id="metric" className="h-10 w-full bg-ink/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sports_days">Most sports days logged</SelectItem>
            <SelectItem value="goal_days">Most days within calorie goal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="start_date">Start</Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            required
            className="h-10 bg-ink/60"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_date">End</Label>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            required
            className="h-10 bg-ink/60"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="stake_points">Stake (points)</Label>
        <Input
          id="stake_points"
          name="stake_points"
          type="number"
          inputMode="numeric"
          min={1}
          defaultValue={10}
          onFocus={(e) => e.target.select()}
          className="h-10 max-w-32 bg-ink/60"
        />
      </div>
      <p className="-mt-1.5 text-xs font-medium text-ink-strong/45">
        Points only — bragging rights, not real money. Winner takes the
        stake.
      </p>

      {state?.error && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm font-medium text-element">Challenge sent.</p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="h-10 w-fit rounded-full bg-element px-5 text-sm font-semibold text-ink hover:bg-element/90"
      >
        {pending ? "Sending…" : "Send challenge"}
      </Button>
    </form>
  );
}
