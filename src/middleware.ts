import { NextRequest, NextResponse } from "next/server";

/**
 * Edge-level route protection (defense in depth + UX).
 *
 * The IAM session cookie is HttpOnly and its validity is enforced
 * authoritatively by Convex on every function call; this middleware adds a
 * fast first line of defense so unauthenticated visitors never render
 * protected pages (no spinner flash, no accidental data fetching).
 *
 * Both cookie names are accepted during the transition to the hardened
 * `__Host-` prefixed session cookie.
 */
const SESSION_COOKIES = ["__Host-tw_session", "tw_session"];

export function middleware(req: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => req.cookies.has(name));
  if (hasSession) return NextResponse.next();

  const signIn = new URL("/sign-in", req.url);
  const target = req.nextUrl.pathname + req.nextUrl.search;
  if (target && target !== "/") {
    signIn.searchParams.set("redirect", target);
  }
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
