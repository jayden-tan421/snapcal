"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Stage = "capture" | "analyzing" | "result";

const STAGE_ORDER: Stage[] = ["capture", "analyzing", "result"];
const STAGE_DURATION: Record<Stage, number> = {
  capture: 1600,
  analyzing: 1900,
  result: 2800,
};

/**
 * The app's one deliberate animated moment: photo capture → analyzing →
 * result reveal, looping inside a tilted phone frame. Everything else in
 * the marketing page is static.
 */
export function PhoneMockup({ className }: { className?: string }) {
  const [stage, setStage] = useState<Stage>("capture");

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextIndex = (STAGE_ORDER.indexOf(stage) + 1) % STAGE_ORDER.length;
      setStage(STAGE_ORDER[nextIndex]);
    }, STAGE_DURATION[stage]);
    return () => clearTimeout(timer);
  }, [stage]);

  return (
    <div
      className={cn(
        "relative mx-auto w-[260px] rotate-3 select-none sm:w-[300px]",
        className
      )}
    >
      {/* phone frame */}
      <div className="relative rounded-[2.6rem] border-[6px] border-ink/90 bg-ink/90 p-2 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)]">
        <div className="absolute top-2 left-1/2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-ink/90" />
        <div className="relative aspect-[9/19] w-full overflow-hidden rounded-[2.1rem] bg-[#2b2016]">
          <FoodPhoto />

          {/* capture: viewfinder chrome + shutter */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col justify-between p-4 transition-opacity duration-500",
              stage === "capture" ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="flex justify-between">
              <ViewfinderCorner className="rotate-0" />
              <ViewfinderCorner className="rotate-90" />
            </div>
            <div className="flex flex-col items-center gap-3">
              <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-ink">
                Snap your meal
              </span>
              <span className="flex size-16 items-center justify-center rounded-full border-4 border-ink/80 bg-element shadow-[0_4px_0_0_rgba(0,0,0,0.25)]">
                <span className="size-11 rounded-full bg-ink animate-pulse" />
              </span>
            </div>
          </div>

          {/* analyzing: scan sweep + label */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-end bg-black/35 p-4 transition-opacity duration-500",
              stage === "analyzing" ? "opacity-100" : "opacity-0"
            )}
          >
            {stage === "analyzing" && (
              <div className="absolute inset-x-0 top-0 h-1 animate-[scan_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-element to-transparent" />
            )}
            <div className="mb-6 flex items-center gap-2 rounded-full bg-ink px-3.5 py-2 shadow-lg">
              <span className="size-3.5 animate-spin rounded-full border-2 border-element border-t-transparent" />
              <span className="font-display text-sm font-medium text-element">
                Analyzing your meal…
              </span>
            </div>
          </div>

          {/* result: bottom sheet with calorie breakdown */}
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 rounded-t-[1.6rem] bg-element p-4 pb-5 shadow-[0_-10px_30px_rgba(0,0,0,0.25)] transition-transform duration-500 ease-out",
              stage === "result" ? "translate-y-0" : "translate-y-[115%]"
            )}
          >
            <p className="text-xs font-medium text-ink/75">
              Grilled salmon bowl
            </p>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-semibold text-ink">
                510
              </span>
              <span className="text-sm font-medium text-ink/80">kcal</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-ink/20 pt-3">
              <Macro label="Protein" value="38g" />
              <Macro label="Carbs" value="46g" />
              <Macro label="Fat" value="18g" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Macro({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-sm font-semibold text-ink">{value}</p>
      <p className="text-[0.65rem] font-medium text-ink/70">{label}</p>
    </div>
  );
}

function ViewfinderCorner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={cn("size-7 text-ink/80", className)}
      fill="none"
    >
      <path
        d="M2 10V4a2 2 0 0 1 2-2h6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FoodPhoto() {
  return (
    <svg
      viewBox="0 0 300 633"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="300" height="633" fill="#4a3826" />
      <ellipse cx="150" cy="300" rx="150" ry="180" fill="#5d4632" />
      {/* bowl */}
      <ellipse cx="150" cy="330" rx="128" ry="80" fill="#e8dcc8" />
      <ellipse cx="150" cy="322" rx="118" ry="68" fill="#f4ede0" />
      {/* rice */}
      <ellipse cx="105" cy="308" rx="55" ry="34" fill="#fbf3e1" />
      {/* greens */}
      <ellipse cx="205" cy="300" rx="42" ry="30" fill="#6a9e3f" />
      <ellipse cx="215" cy="290" rx="24" ry="16" fill="#83b854" />
      {/* salmon */}
      <ellipse cx="150" cy="345" rx="46" ry="24" fill="#e0784f" />
      <ellipse cx="150" cy="345" rx="46" ry="24" fill="url(#salmonGrad)" />
      {/* egg */}
      <circle cx="90" cy="355" r="16" fill="#fff6df" />
      <circle cx="90" cy="355" r="8" fill="#f5b940" />
      {/* cherry tomatoes */}
      <circle cx="205" cy="350" r="7" fill="#c64446" />
      <circle cx="220" cy="360" r="6" fill="#c64446" />
      {/* sesame specks */}
      <circle cx="130" cy="320" r="1.6" fill="#fff" opacity="0.8" />
      <circle cx="170" cy="335" r="1.6" fill="#fff" opacity="0.8" />
      <circle cx="145" cy="300" r="1.6" fill="#fff" opacity="0.8" />
      <defs>
        <linearGradient id="salmonGrad" x1="104" y1="321" x2="196" y2="369">
          <stop offset="0" stopColor="#eb8a5c" />
          <stop offset="1" stopColor="#d4602f" />
        </linearGradient>
      </defs>
    </svg>
  );
}
