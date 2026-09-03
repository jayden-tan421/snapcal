import Link from "next/link";
import { Logo } from "@/components/marketing/logo";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-canvas px-5 py-12">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <div className="w-full max-w-sm rounded-3xl bg-card p-7 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)] sm:p-8">
        <h1 className="font-display text-2xl font-semibold text-ink-strong">
          {title}
        </h1>
        <p className="mt-1.5 text-sm font-medium text-ink-strong/70">
          {subtitle}
        </p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
