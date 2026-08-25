import { NextRequest, NextResponse } from "next/server";

const publicRoutes = [
  "/",
  "/store",
  "/resources",
  "/about",
  "/contact",
  "/cart",
  "/checkout",
  "/order-confirmation",
  "/faq",
  "/terms",
  "/privacy",
  "/refund-policy",
  "/sign-in",
  "/sign-up",
  "/verify-email",
  "/reset-password",
  "/api/auth",
  "/pesapal-callback",
  "/api/checkout",
  "/api/pesapal",
  "/api/stripe",
  "/_next",
  "/favicon.ico",
];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => {
    if (route === "/") return pathname === "/";
    if (route.includes("(")) {
      const regex = new RegExp("^" + route.replace(/\(\.\*\)/g, ".*") + "$");
      return regex.test(pathname);
    }
    return pathname === route || pathname.startsWith(route + "/");
  });
}

function getConvexSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_CONVEX_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return (process.env.NEXT_PUBLIC_CONVEX_URL ?? "")
    .replace(/\.convex\.cloud\/?$/, ".convex.site")
    .replace(/\/$/, "");
}

function redirectToSignIn(req: NextRequest): NextResponse {
  const signInUrl = new URL("/sign-in", req.url);
  signInUrl.searchParams.set("redirect", req.nextUrl.pathname);
  return NextResponse.redirect(signInUrl);
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get("tw_session")?.value;
  if (!sessionCookie) {
    return redirectToSignIn(req);
  }

  try {
    const convexSiteUrl = getConvexSiteUrl();
    // SECURITY: fail closed. If the Convex site URL cannot be resolved we must
    // NOT let the request through — an unvalidated session must never reach a
    // protected route.
    if (!convexSiteUrl) {
      console.error("Auth middleware misconfigured: CONVEX site URL is not set");
      return redirectToSignIn(req);
    }

    const res = await fetch(`${convexSiteUrl}/iam/me`, {
      method: "GET",
      headers: { cookie: req.headers.get("cookie") ?? "" },
      cache: "no-store",
    });

    if (!res.ok) {
      return redirectToSignIn(req);
    }
  } catch {
    // Network failure validating the session also fails closed.
    return redirectToSignIn(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
