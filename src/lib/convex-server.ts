import { ConvexHttpClient } from "convex/browser";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;

/**
 * Server-side Convex client for sitemaps, generateMetadata, and other
 * non-React server code. Returns null when Convex isn't configured so
 * builds never fail.
 */
export const convexServer = url ? new ConvexHttpClient(url) : null;
