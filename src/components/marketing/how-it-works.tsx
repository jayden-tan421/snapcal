import { Camera, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    number: "1",
    icon: Camera,
    title: "Snap a photo",
    body: "Point your camera at your plate. That's the whole input — no menus to search, no barcodes to find.",
  },
  {
    number: "2",
    icon: Sparkles,
    title: "AI reads it",
    body: "Gemini identifies what's on your plate and estimates portions, calories, and macros in seconds.",
  },
  {
    number: "3",
    icon: CheckCircle2,
    title: "It's logged",
    body: "Review or tweak the numbers if you want, then it's saved to today's total automatically.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="bg-canvas py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 className="max-w-lg font-display text-3xl font-semibold text-ink [text-shadow:0_2px_0_rgba(198,68,70,0.3)] sm:text-4xl">
          Three steps. No food diary busywork.
        </h2>

        <div className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative">
              {i < STEPS.length - 1 && (
                <div
                  aria-hidden
                  className="absolute top-8 left-[calc(100%-1rem)] hidden h-px w-[calc(100%-2rem)] border-t-2 border-dashed border-ink-strong/20 sm:block"
                />
              )}
              <div
                className={cn(
                  "flex size-16 items-center justify-center rounded-2xl bg-element text-ink shadow-[0_3px_0_0_rgba(0,0,0,0.15)]"
                )}
              >
                <step.icon className="size-7" strokeWidth={2.25} />
              </div>
              <p className="mt-5 font-display text-sm font-semibold text-ink-strong/60">
                Step {step.number}
              </p>
              <h3 className="mt-1 font-display text-xl font-semibold text-ink-strong">
                {step.title}
              </h3>
              <p className="mt-2 max-w-xs text-[0.95rem] leading-relaxed font-medium text-ink-strong/80">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
