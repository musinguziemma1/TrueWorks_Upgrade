import { cache } from "react";
import { api } from "@convex/_generated/api";
import { convexServer } from "@/lib/convex-server";
import { normalizeHomepageVariant } from "@/lib/homepage-variant";

/** Resolve on the server so visitors never see a different layout during hydration. */
export const getHomepageVariant = cache(async () => {
  if (!convexServer) return normalizeHomepageVariant(undefined);
  try {
    const settings = await convexServer.query(api.settings.getPublic, {});
    return normalizeHomepageVariant(settings.homepageVariant);
  } catch (error) {
    console.error("Unable to resolve homepage layout; keeping Classic", error);
    return normalizeHomepageVariant(undefined);
  }
});
