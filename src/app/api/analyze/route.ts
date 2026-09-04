import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGeminiClient, GEMINI_MODEL, GEMINI_FALLBACK_MODEL } from "@/lib/gemini/client";
import { MEAL_ANALYSIS_PROMPT, parseMealAnalysis } from "@/lib/gemini/prompt";

export const runtime = "nodejs";
// Vercel's default serverless function timeout is 10s on the Hobby plan —
// well under the 20s ceiling we give the Gemini call below. Without this,
// a slow-but-otherwise-fine analysis gets killed by the platform itself,
// which returns a raw (non-JSON) timeout page instead of our own error
// response.
export const maxDuration = 60;

// Meal photos are compressed client-side to ~800px/JPEG70, so this is a
// generous ceiling that still blocks anything abusive.
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

function errorStatus(err: unknown): number | undefined {
  return (err as { status?: number; statusCode?: number })?.status ??
    (err as { status?: number; statusCode?: number })?.statusCode;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** True for a transient capacity issue on Google's side (their own free-
 * tier quota-exceeded errors surface as 429, not this) — the one case
 * worth one fallback attempt against a different model instead of
 * failing the whole request outright.
 *
 * Verified live that an overloaded model doesn't only fail with a clean
 * 503 — the same outage also shows up as our own 20s client-side timeout
 * aborting the request before Google ever replies (name "AbortError",
 * message "This operation was aborted"), with no status code at all. Both
 * are the same underlying signal ("the primary model isn't answering right
 * now"), so both should trigger the fallback attempt. */
function isOverloadedError(err: unknown): boolean {
  if (errorStatus(err) === 503) return true;
  if (err instanceof Error && err.name === "AbortError") return true;
  return /503|overloaded|high demand|abort|timeout/i.test(errorMessage(err));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "invalid_request", message: "No image file provided." },
      { status: 400 }
    );
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "invalid_request", message: "Image is too large." },
      { status: 400 }
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);
  const mimeType = file.type || "image/jpeg";

  try {
    const genAI = getGeminiClient();
    const parts = [MEAL_ANALYSIS_PROMPT, { inlineData: { data: base64, mimeType } }];
    // The SDK's default retry/backoff on a 503 can drag an interactive
    // request out for a minute or more — cap each attempt so the UI can
    // fall back to manual entry quickly instead of leaving the user
    // staring at a spinner.
    const callOptions = { timeout: 20_000 };

    let result;
    try {
      result = await genAI
        .getGenerativeModel({ model: GEMINI_MODEL })
        .generateContent(parts, callOptions);
    } catch (primaryErr) {
      if (!isOverloadedError(primaryErr)) throw primaryErr;
      // Primary is down on Google's side (not our quota) — one fallback
      // attempt against a different model/tier before giving up entirely.
      console.error(
        `${GEMINI_MODEL} overloaded, falling back to ${GEMINI_FALLBACK_MODEL}`
      );
      result = await genAI
        .getGenerativeModel({ model: GEMINI_FALLBACK_MODEL })
        .generateContent(parts, callOptions);
    }

    const text = result.response.text();
    const analysis = parseMealAnalysis(text);

    if (!analysis) {
      return NextResponse.json(
        {
          error: "parse_failed",
          message:
            "Couldn't read that photo clearly. Try again, or enter it manually.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ analysis });
  } catch (err) {
    const message = errorMessage(err);

    // The Gemini SDK surfaces rate limiting as a 429 status on the thrown
    // error (either in the message or a `.status`/`.statusCode` field).
    const isRateLimit = errorStatus(err) === 429 || /429|quota|rate.?limit/i.test(message);

    if (isRateLimit) {
      return NextResponse.json(
        {
          error: "rate_limited",
          message:
            "Daily AI limit reached — try again tomorrow, or enter this meal manually.",
        },
        { status: 429 }
      );
    }

    console.error("Gemini analysis failed:", message);
    return NextResponse.json(
      {
        error: "analysis_failed",
        message: "Something went wrong analyzing that photo. Try again, or enter it manually.",
      },
      { status: 502 }
    );
  }
}
