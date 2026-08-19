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

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get("tw_session")?.value;
  if (!sessionCookie) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(/\/$/, "");
    if (!convexUrl) return NextResponse.next();

    const res = await fetch(`${convexUrl}/api/auth/me`, {
      method: "GET",
      headers: { cookie: req.headers.get("cookie") ?? "" },
      cache: "no-store",
    });

    if (!res.ok) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(signInUrl);
    }
  } catch {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
