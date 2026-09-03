import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/marketing/logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-canvas/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" className="text-ink-strong hover:bg-ink-strong/10">
            <Link href="/login">Log in</Link>
          </Button>
          <Button
            asChild
            className="rounded-full bg-element px-4 text-ink shadow-[0_3px_0_0_rgba(0,0,0,0.15)] hover:bg-element/90"
          >
            <Link href="/signup">Get started</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
