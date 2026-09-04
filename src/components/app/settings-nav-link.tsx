"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { playSound } from "@/lib/sound";

/** A Settings-page nav card (Sharing, Admin, …) — split out as its own
 *  client component just so it can play a tap sound on click, since the
 *  Settings page itself is a Server Component. */
export function SettingsNavLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      onClick={() => playSound("tap")}
      className="flex items-center gap-3 rounded-3xl bg-card p-5"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-element/10 text-element">
        <Icon className="size-5" />
      </span>
      <span>
        <span className="block font-display text-base font-semibold text-ink-strong">
          {title}
        </span>
        <span className="block text-sm font-medium text-ink-strong/60">
          {description}
        </span>
      </span>
    </Link>
  );
}
