"use client";

/**
 * Lightweight UI sound effects, synthesized on the fly with the Web Audio
 * API — no audio files to ship, license, or fetch. Reserved for key
 * moments only (a meal saved, a goal saved, an error, a destructive
 * confirmation), not every tap, so it stays a nice touch rather than
 * noise.
 *
 * Respects a per-browser mute preference stored in localStorage
 * (default: on).
 */

const STORAGE_KEY = "snapcal:sound-enabled";
/** Fired locally whenever the preference changes, so a component reading it
 *  via useSyncExternalStore can re-render — the browser's own "storage"
 *  event only fires in *other* tabs, never the tab that made the write. */
const PREF_CHANGED_EVENT = "snapcal:sound-pref-changed";

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  // Browsers start a freshly-created context "suspended" until a user
  // gesture unlocks it — playSound() is always called from inside a click
  // or form-submit handler, so this resume() call is itself within that
  // gesture and succeeds synchronously enough for the sound to play.
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "1";
  } catch {
    // Storage blocked (private mode, locked-down browser) — default on.
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // Preference just won't persist across visits; not worth surfacing.
  }
  window.dispatchEvent(new Event(PREF_CHANGED_EVENT));
}

/** Subscribes to sound-preference changes made in this tab or another one. */
export function subscribeSoundEnabled(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(PREF_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(PREF_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

interface Note {
  freq: number;
  start: number;
  duration: number;
  gain?: number;
  type?: OscillatorType;
}

function playNotes(notes: Note[]) {
  const audioCtx = getContext();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  for (const note of notes) {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = note.type ?? "sine";
    osc.frequency.value = note.freq;

    const startAt = now + note.start;
    const peak = note.gain ?? 0.12;
    // Quick linear attack then an exponential decay reads as a soft,
    // rounded "pop"/"chime" rather than a harsh beep.
    gainNode.gain.setValueAtTime(0, startAt);
    gainNode.gain.linearRampToValueAtTime(peak, startAt + 0.012);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + note.duration);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start(startAt);
    osc.stop(startAt + note.duration + 0.02);
  }
}

export type SoundEffect = "success" | "error" | "delete";

/** Plays a short synthesized UI sound, unless the user has muted sound effects. */
export function playSound(effect: SoundEffect): void {
  if (!isSoundEnabled()) return;

  switch (effect) {
    case "success":
      // Cheerful two-note rise — meal logged, goal saved, invite sent.
      playNotes([
        { freq: 587.33, start: 0, duration: 0.12, gain: 0.11 }, // D5
        { freq: 880, start: 0.09, duration: 0.16, gain: 0.13 }, // A5
      ]);
      break;
    case "error":
      // Gentle two-note dip — clearly "not quite", never harsh.
      playNotes([
        { freq: 392, start: 0, duration: 0.14, gain: 0.1 }, // G4
        { freq: 293.66, start: 0.1, duration: 0.18, gain: 0.09 }, // D4
      ]);
      break;
    case "delete":
      // A single lower, slower triangle tone for an irreversible action.
      playNotes([
        { freq: 220, start: 0, duration: 0.22, gain: 0.11, type: "triangle" },
      ]);
      break;
  }
}
