import Link from "next/link";
import { Logo } from "@/components/marketing/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/15 bg-element py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 text-center sm:flex-row sm:justify-between sm:px-8 sm:text-left">
        <Logo onElement />
        <p className="text-sm font-medium text-ink/80">
          Built for people who want the number, not the busywork.
        </p>
        <nav className="flex gap-5 text-sm font-medium text-ink/90">
          <Link href="/login" className="hover:text-ink">
            Log in
          </Link>
          <Link href="/signup" className="hover:text-ink">
            Sign up
          </Link>
        </nav>
      </div>
    </footer>
  );
}
