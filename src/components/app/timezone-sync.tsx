"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Mounted once in the app shell. Detects the visitor's IANA timezone and
 * syncs it into a cookie so server components can compute "today"
 * correctly (see src/lib/timezone.ts) instead of using the server's own
 * timezone (UTC on Vercel).
 */
export function TimezoneSync() {
  const router = useRouter();

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && getCookie("tz") !== tz) {
        document.cookie = `tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; SameSite=Lax`;
        // Re-render the current server tree now that the cookie is
        // correct, instead of waiting for the next navigation.
        router.refresh();
      }
    } catch {
      // Intl unavailable/restricted — server falls back to UTC.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
