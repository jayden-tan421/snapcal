import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PhoneMockup } from "@/components/marketing/phone-mockup";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-canvas pt-14 pb-20 sm:pt-20 sm:pb-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <div className="max-w-xl">
          <span className="inline-flex items-center rounded-full bg-element px-3.5 py-1.5 text-sm font-medium text-ink">
            Free, forever &mdash; no food database required
          </span>

          <h1 className="mt-5 font-display text-[2.75rem] leading-[1.05] font-semibold text-ink [text-shadow:0_3px_0_rgba(198,68,70,0.35)] sm:text-6xl">
            Snap your meal.
            <br />
            Know your calories.
          </h1>

          <p className="mt-5 max-w-md text-lg font-medium text-ink-strong">
            SnapCal reads a photo of your food with AI and logs the
            calories and macros for you — no searching, no scanning
            barcodes, no typing.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              asChild
              className="h-auto rounded-full bg-element px-7 py-3.5 text-base font-semibold text-ink shadow-[0_4px_0_0_rgba(0,0,0,0.18)] hover:bg-element/90 active:translate-y-0.5 active:shadow-[0_2px_0_0_rgba(0,0,0,0.18)]"
            >
              <Link href="/signup">Get started free</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-auto rounded-full px-5 py-3.5 text-base font-semibold text-ink-strong hover:bg-ink-strong/10"
            >
              <Link href="/login">I already have an account</Link>
            </Button>
          </div>
        </div>

        <PhoneMockup />
      </div>
    </section>
  );
}
