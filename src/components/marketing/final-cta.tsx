import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="bg-canvas py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        <h2 className="font-display text-3xl font-semibold text-ink [text-shadow:0_3px_0_rgba(198,68,70,0.35)] sm:text-5xl">
          Start logging in under a minute.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg font-medium text-ink-strong">
          No credit card, no food database to learn. Just snap and go.
        </p>
        <Button
          asChild
          className="mt-8 h-auto rounded-full bg-element px-8 py-4 text-base font-semibold text-ink shadow-[0_4px_0_0_rgba(0,0,0,0.18)] hover:bg-element/90 active:translate-y-0.5 active:shadow-[0_2px_0_0_rgba(0,0,0,0.18)]"
        >
          <Link href="/signup">Get started free</Link>
        </Button>
      </div>
    </section>
  );
}
