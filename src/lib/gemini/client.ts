import { GoogleGenerativeAI } from "@google/generative-ai";

let client: GoogleGenerativeAI | null = null;

/** Server-only. Never import this from a Client Component. */
export function getGeminiClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

// Tried, in order, before landing here (see git history / chat for the
// full investigation):
//   - "gemini-flash-latest"      → a FLOATING alias, not a stable release.
//     It silently resolved to a brand-new "gemini-3.8-flash" and returned
//     503 "high demand" under completely normal, low-volume use — a
//     just-launched model still absorbing its initial traffic spike, not
//     our quota being exhausted.
//   - "gemini-2.5-flash"          → 404: deprecated, unavailable to new
//     API keys/users.
//   - "gemini-3.6-flash" (Google's own suggested 2.5 replacement) → reasons
//     ("thinking") by default even for this simple task (100+ hidden
//     "thoughtsTokenCount" on a trivial prompt) and hung for 40s+ on the
//     actual vision+JSON request — unusable for an interactive flow. Also
//     observed a very low free-tier daily cap (~20 requests/day peak) on
//     the Google AI Studio dashboard.
//   - "gemini-flash-lite-latest" → worked (fast, correct), but it's still a
//     floating alias — exactly the kind of thing that drifted us into the
//     3.8-flash problem above once Google ships the next default.
// "gemini-3.5-flash-lite" is a *pinned*, specific dated release on the
// Flash-Lite tier: no extended-thinking overhead, verified fast (~2s) and
// correct on this exact vision+JSON task, and Flash-Lite's free-tier quota
// is meaningfully higher-throughput than full Flash. Being pinned (not
// "-latest") means it won't silently change again — bump it deliberately.
export const GEMINI_MODEL = "gemini-3.5-flash-lite";

// Even a pinned model can have a genuine outage on Google's side — verified
// live: gemini-3.5-flash-lite returned 503 "high demand" on 6/6 direct API
// calls in a row (not our quota; Google's own capacity), while
// gemini-flash-latest responded fine at the same moment. Used ONLY as a
// fallback when the primary model specifically fails with an overload
// error (see isOverloadedError in api/analyze/route.ts) — never as the
// default — so the "floating alias silently drifts to an overloaded
// brand-new model" risk that got us off "-latest" in the first place stays
// limited to the rare moment the pinned primary is already down anyway.
export const GEMINI_FALLBACK_MODEL = "gemini-flash-latest";
