"use client";

import { useActionState, useEffect, useState } from "react";
import { Calendar, Minus, Plus, Send, Swords, Target } from "lucide-react";
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
  const [stake, setStake] = useState(10);

  useEffect(() => {
    if (!state) return;
    if (state.success) playSound("success");
    else if (state.error) playSound("error");
  }, [state]);

  function nudgeStake(delta: number) {
    playSound("tap");
    setStake((s) => Math.max(1, s + delta));
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="space-y-1.5">
        <Label htmlFor="opponent_id" className="flex items-center gap-1.5">
          <Swords className="size-3.5 text-element" /> Challenge
        </Label>
        <Select name="opponent_id" defaultValue={connections[0]?.id}>
          <SelectTrigger id="opponent_id" className="h-11 w-full bg-ink/60">
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
        <Label htmlFor="metric" className="flex items-center gap-1.5">
          <Target className="size-3.5 text-element" /> On
        </Label>
        <Select name="metric" defaultValue="sports_days">
          <SelectTrigger id="metric" className="h-11 w-full bg-ink/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sports_days">Most sports days logged</SelectItem>
            <SelectItem value="goal_days">Most days within calorie goal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <Calendar className="size-3.5 text-element" /> Dates
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="start_date"
            name="start_date"
            type="date"
            required
            aria-label="Start date"
            className="h-11 flex-1 bg-ink/60"
          />
          <span className="shrink-0 text-sm font-medium text-ink-strong/40">
            to
          </span>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            required
            aria-label="End date"
            className="h-11 flex-1 bg-ink/60"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-background/40 p-4">
        <p className="text-center text-xs font-semibold tracking-wide text-ink-strong/50 uppercase">
          Stake
        </p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => nudgeStake(-5)}
            aria-label="Decrease stake by 5"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink-strong/10 text-ink-strong hover:bg-ink-strong/15"
          >
            <Minus className="size-4" />
          </button>
          <div className="flex items-baseline gap-1">
            <input
              id="stake_points"
              name="stake_points"
              type="number"
              inputMode="numeric"
              min={1}
              value={stake}
              onChange={(e) => setStake(Math.max(1, Number(e.target.value) || 0))}
              onFocus={(e) => e.target.select()}
              className="w-16 bg-transparent text-center font-display text-3xl font-semibold text-ink-strong outline-none"
            />
            <span className="text-sm font-semibold text-ink-strong/50">pts</span>
          </div>
          <button
            type="button"
            onClick={() => nudgeStake(5)}
            aria-label="Increase stake by 5"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink-strong/10 text-ink-strong hover:bg-ink-strong/15"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-xs font-medium text-ink-strong/45">
          Points only — bragging rights, not real money. Winner takes the
          stake.
        </p>
      </div>

      {state?.error && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm font-medium text-element">Challenge sent.</p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-element text-sm font-semibold text-ink shadow-[0_3px_0_0_rgba(0,0,0,0.18)] hover:bg-element/90 active:translate-y-0.5 active:shadow-[0_1px_0_0_rgba(0,0,0,0.18)]"
      >
        <Send className="size-4" />
        {pending ? "Sending…" : "Send challenge"}
      </Button>
    </form>
  );
}
