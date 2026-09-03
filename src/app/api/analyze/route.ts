import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGeminiClient, GEMINI_MODEL } from "@/lib/gemini/client";
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
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const result = await model.generateContent(
      [MEAL_ANALYSIS_PROMPT, { inlineData: { data: base64, mimeType } }],
      // The SDK's default retry/backoff on a 503 can drag an interactive
      // request out for a minute or more — cap it so the UI can fall back
      // to manual entry quickly instead of leaving the user staring at a
      // spinner.
      { timeout: 20_000 }
    );

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
    const message = err instanceof Error ? err.message : String(err);

    // The Gemini SDK surfaces rate limiting as a 429 status on the thrown
    // error (either in the message or a `.status`/`.statusCode` field).
    const status =
      (err as { status?: number; statusCode?: number })?.status ??
      (err as { status?: number; statusCode?: number })?.statusCode;
    const isRateLimit = status === 429 || /429|quota|rate.?limit/i.test(message);

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
