"use client";

import { useSyncExternalStore } from "react";
import { Switch } from "@/components/ui/switch";
import {
  isSoundEnabled,
  playSound,
  setSoundEnabled,
  subscribeSoundEnabled,
} from "@/lib/sound";

// Server snapshot matches isSoundEnabled()'s own SSR default (on), so
// there's nothing to reconcile after hydration.
const getServerSnapshot = () => true;

export function SoundToggle() {
  const enabled = useSyncExternalStore(
    subscribeSoundEnabled,
    isSoundEnabled,
    getServerSnapshot
  );

  function handleChange(next: boolean) {
    setSoundEnabled(next);
    if (next) playSound("success");
  }

  return (
    <div className="flex items-center justify-between rounded-3xl bg-card p-5">
      <div>
        <p className="font-display text-base font-semibold text-ink-strong">
          Sound effects
        </p>
        <p className="mt-0.5 text-sm font-medium text-ink-strong/60">
          Little chimes for saves, logs, and errors
        </p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={handleChange}
        aria-label="Sound effects"
      />
    </div>
  );
}
