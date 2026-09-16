/**
 * Homepage variant registry.
 *
 * TrueWorks ships more than one homepage experience. Which one is rendered at
 * `/` is controlled from the admin dashboard (Settings → Homepage, or the
 * layout panel on the Content screen) via the `homepageVariant` setting.
 *
 * This is a pure module — no server-only imports — so it can be consumed by
 * server components, client components and the admin UI alike.
 */

export type HomepageVariant = "classic" | "nextgen";

export interface HomepageVariantMeta {
  value: HomepageVariant;
  label: string;
  tagline: string;
  description: string;
  /** Route where the variant can be previewed without switching the live site. */
  previewHref: string;
  highlights: string[];
}

/** Public preview surface for the next-generation homepage (noindex). */
export const NEXTGEN_PREVIEW_PATH = "/preview/home-v2";

/** Deep link into the admin homepage layout controls. */
export const ADMIN_HOMEPAGE_SETTINGS_PATH = "/admin/settings?tab=homepage";

export const HOMEPAGE_VARIANTS: HomepageVariantMeta[] = [
  {
    value: "classic",
    label: "Classic Storefront",
    tagline: "The homepage that is live today",
    description:
      "Hero slider, trusted-by marquee, featured templates, industries carousel and the store-focused conversion flow.",
    previewHref: "/preview/classic",
    highlights: [
      "Cinematic hero slider",
      "Template-first merchandising",
      "Store-led conversion path",
    ],
  },
  {
    value: "nextgen",
    label: "Next-Gen Business Systems",
    tagline: "Editorial, dashboard-led experience",
    description:
      "A premium business-systems homepage: interactive dashboard hero, product explorer, live data-to-decision demo, industry experience and conceptual impact metrics.",
    previewHref: NEXTGEN_PREVIEW_PATH,
    highlights: [
      "Interactive dashboard hero",
      "Product explorer with motion",
      "Data-to-decision showcase",
    ],
  },
];

export const DEFAULT_HOMEPAGE_VARIANT: HomepageVariant = "classic";

export const HOMEPAGE_VARIANT_VALUES: HomepageVariant[] = HOMEPAGE_VARIANTS.map(
  (variant) => variant.value
);

/** Coerce any stored value into a supported variant, falling back to default. */
export function normalizeHomepageVariant(value: unknown): HomepageVariant {
  return HOMEPAGE_VARIANT_VALUES.includes(value as HomepageVariant)
    ? (value as HomepageVariant)
    : DEFAULT_HOMEPAGE_VARIANT;
}

export function getHomepageVariantMeta(
  value: HomepageVariant
): HomepageVariantMeta {
  return (
    HOMEPAGE_VARIANTS.find((variant) => variant.value === value) ??
    HOMEPAGE_VARIANTS[0]
  );
}

/** Human label for a variant value, for use in the admin UI. */
export function homepageVariantLabel(value: unknown): string {
  return getHomepageVariantMeta(normalizeHomepageVariant(value)).label;
}