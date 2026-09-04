"use client";

import Link from "next/link";
import { playSound } from "@/lib/sound";

/** A card-shaped nav link (Sharing, Admin, Crossbet, …) — split out as its
 *  own client component just so it can play a tap sound on click, since
 *  the pages that use it (Settings, Shared) are Server Components.
 *
 *  `icon` takes an already-rendered element (e.g. `<Users className="..." />`),
 *  not a component reference — a Server Component can pass JSX across the
 *  server/client boundary, but not a bare function/component type, which
 *  Next.js can't serialize and throws on. */
export function NavCardLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
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
        {icon}
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
