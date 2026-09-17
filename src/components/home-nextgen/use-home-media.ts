"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  FREE_DASHBOARD,
  HERO_MEDIA,
  INDUSTRIES,
  PRODUCT_CATEGORIES,
  type MediaAsset,
} from "./data";

/* -------------------------------------------------------------------------- *
 * Real-media resolver for the next-generation homepage.
 *
 * The CMS is the source of truth: product thumbnails uploaded through
 * Admin → Media (stored in Convex) are matched to home-v2 sections by
 * category name. When nothing matches, the designed placeholder is kept, so
 * the layout never changes — only the artwork improves.
 * -------------------------------------------------------------------------- */

type CmsProduct = {
  _id: string;
  name?: string;
  thumbnail?: string;
  category?: string;
  industry?: string;
  featured?: boolean;
};

/** Parse the decoded `category=<name>` out of an exploreHref. */
function categoryFromHref(href: string): string {
  try {
    const match = /category=([^&]+)/.exec(href);
    return match ? decodeURIComponent(match[1]) : "";
  } catch {
    return "";
  }
}

function matches(haystack: string | undefined, needle: string): boolean {
  if (!haystack) return false;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  return h.includes(n) || n.includes(h);
}

export function useHomeMedia(): {
  hero: MediaAsset;
  products: MediaAsset[];
  industries: MediaAsset[];
  freeDashboard: MediaAsset;
  loading: boolean;
} {
  const products = useQuery(api.products.list, {}) as CmsProduct[] | undefined;

  return useMemo(() => {
    const withImages = products?.filter((p) => Boolean(p.thumbnail)) ?? [];
    const loading = products === undefined;

    const productAssets: MediaAsset[] = PRODUCT_CATEGORIES.map((category) => {
      const wanted = categoryFromHref(category.exploreHref);
      const asset = { ...category.media };
      const hit = withImages.find(
        (p) => wanted && (matches(p.category, wanted) || matches(p.name, category.label)),
      );
      if (hit?.thumbnail) asset.src = hit.thumbnail;
      return asset;
    });

    const industryAssets: MediaAsset[] = INDUSTRIES.map((industry) => {
      const asset = { ...industry.media };
      const hit =
        withImages.find((p) => matches(p.industry, industry.label)) ??
        withImages.find((p) => matches(p.category, industry.label)) ??
        withImages.find((p) => matches(p.name, industry.label));
      if (hit?.thumbnail) asset.src = hit.thumbnail;
      return asset;
    });

    const hero = { ...HERO_MEDIA };
    const featured = withImages.find((p) => p.featured);
    if (featured?.thumbnail) {
      hero.src = featured.thumbnail;
      hero.alt = `${featured.name ?? "Featured TrueWorks system"} — live product preview from the TrueWorks catalog`;
    }

    const freeDashboard = { ...FREE_DASHBOARD.media };
    const freeHit =
      byName("hospital kpi") ??
      byCategory("hospital");

    function byName(needle: string) {
      return withImages.find((p) => matches(p.name, needle));
    }
    function byCategory(needle: string) {
      return withImages.find((p) => matches(p.category, needle));
    }

    if (freeHit?.thumbnail) freeDashboard.src = freeHit.thumbnail;

    return { hero, products: productAssets, industries: industryAssets, freeDashboard, loading };
  }, [products]);
}
