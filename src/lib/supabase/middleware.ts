import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every request so server components
 * always see a valid (non-expired) session. Also used to gate app routes
 * behind login.
 *
 * Also forwards the already-validated user via trusted request headers
 * (x-user-id / x-user-email) so downstream Server Components — see
 * getCurrentUser() in queries.ts — don't need their own second
 * supabase.auth.getUser() network round-trip. That redundant second call
 * was doubling the auth-check latency on every single navigation, which is
 * what made switching tabs/menu items feel slow.
 */
export async function updateSession(request: NextRequest) {
  // getAll/setAll below both need to read/write the *request* cookies (so
  // the Supabase client sees a consistent view within this function), but
  // we can't build the final NextResponse until we know the outcome
  // (redirect vs. continue) and have mutated request.headers — so collect
  // the cookies Supabase wants to set and apply them, with their original
  // options, to whichever response we end up returning.
  const cookiesToForward: { name: string; value: string; options: CookieOptions }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToForward.push(...cookiesToSet);
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAppRoute =
    path.startsWith("/dashboard") ||
    path.startsWith("/history") ||
    path.startsWith("/settings") ||
    path.startsWith("/shared");
  const isAuthRoute = path.startsWith("/login") || path.startsWith("/signup");

  if (!user && isAppRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    const redirectResponse = NextResponse.redirect(url);
    cookiesToForward.forEach(({ name, value, options }) =>
      redirectResponse.cookies.set(name, value, options)
    );
    return redirectResponse;
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    const redirectResponse = NextResponse.redirect(url);
    cookiesToForward.forEach(({ name, value, options }) =>
      redirectResponse.cookies.set(name, value, options)
    );
    return redirectResponse;
  }

  // Always set/clear explicitly — a client could in principle send its own
  // x-user-id header, so we must overwrite (or remove) it unconditionally
  // rather than only setting it when present, or a spoofed value could
  // survive through to a route that doesn't need auth.
  if (user) {
    request.headers.set("x-user-id", user.id);
    request.headers.set("x-user-email", user.email ?? "");
  } else {
    request.headers.delete("x-user-id");
    request.headers.delete("x-user-email");
  }

  const response = NextResponse.next({ request });
  cookiesToForward.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  );
  return response;
}
