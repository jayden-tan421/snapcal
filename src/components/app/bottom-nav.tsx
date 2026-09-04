"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, History, Home, Settings, Users } from "lucide-react";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Today", icon: Home },
  { href: "/history", label: "History", icon: History },
  { href: "/shared", label: "Shared", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav({ onLog }: { onLog: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-strong/10 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-2">
        {LINKS.slice(0, 2).map((link) => (
          <NavLink key={link.href} {...link} active={pathname === link.href} />
        ))}

        <button
          type="button"
          onClick={() => {
            playSound("tap");
            onLog();
          }}
          className="-mt-8 flex size-16 shrink-0 items-center justify-center rounded-full bg-element text-ink shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:translate-y-0.5"
          aria-label="Log a meal"
        >
          <Camera className="size-6" />
        </button>

        {LINKS.slice(2).map((link) => (
          <NavLink key={link.href} {...link} active={pathname === link.href} />
        ))}
      </div>
    </nav>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={() => playSound("tap")}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "text-element" : "text-ink-strong/55 hover:text-ink-strong"
      )}
    >
      <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
      {label}
    </Link>
  );
}
