import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/marketing/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-canvas px-5 py-16 text-center">
      <Logo />
      <p className="font-display text-6xl font-semibold text-ink [text-shadow:0_3px_0_rgba(198,68,70,0.35)]">
        404
      </p>
      <p className="max-w-xs text-base font-medium text-ink-strong">
        This page wandered off your plate.
      </p>
      <Button
        asChild
        className="mt-2 h-auto rounded-full bg-element px-6 py-3 text-sm font-semibold text-ink shadow-[0_3px_0_0_rgba(0,0,0,0.18)] hover:bg-element/90"
      >
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}
