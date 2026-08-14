import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/store(.*)",
  "/resources(.*)",
  "/about(.*)",
  "/contact(.*)",
  "/cart",
  "/checkout",
  "/order-confirmation",
  "/faq",
  "/terms",
  "/privacy",
  "/refund-policy",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/pesapal-callback(.*)",
  "/api/checkout(.*)",
  "/api/pesapal(.*)",
  "/api/stripe(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
