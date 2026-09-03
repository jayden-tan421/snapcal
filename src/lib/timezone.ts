// "Today" for a calorie tracker has to mean the visitor's local day, not the
// server's. Vercel's Node runtime runs in UTC, so naively using `new Date()`
// + setHours(0,0,0,0) on the server silently uses UTC's midnight instead of
// the user's — meals logged late at night (relative to UTC) would land on
// the wrong day. We sync the visitor's IANA timezone into a cookie
// client-side (see TimezoneSync) and every server read goes through here.

const DEFAULT_TIMEZONE = "UTC";

/** Validates a cookie-supplied timezone string, falling back to UTC. */
export function resolveTimezone(cookieValue: string | undefined | null): string {
  if (!cookieValue) return DEFAULT_TIMEZONE;
  try {
    // Throws RangeError for anything that isn't a real IANA zone.
    new Intl.DateTimeFormat("en-US", { timeZone: cookieValue });
    return cookieValue;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/** "YYYY-MM-DD" for `date` as seen in `timeZone`. */
export function localDateKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function utcOffsetMinutes(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const raw = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+0";
  const match = raw.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = parseInt(match[2], 10);
  const minutes = match[3] ? parseInt(match[3], 10) : 0;
  return sign * (hours * 60 + minutes);
}

/** Start of the local calendar day containing `date`, as a UTC instant. */
export function startOfLocalDay(date: Date, timeZone: string): Date {
  const key = localDateKey(date, timeZone);
  const [y, m, d] = key.split("-").map(Number);
  const offsetMin = utcOffsetMinutes(timeZone, date);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - offsetMin * 60_000);
}

/** [startIso, endIso) covering the local calendar day containing `date`. */
export function localDayRangeIso(date: Date, timeZone: string) {
  const start = startOfLocalDay(date, timeZone);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}
