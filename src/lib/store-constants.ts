/**
 * Shared storefront constants.
 *
 * Lives outside the client component so the server page can prefetch exactly
 * the same first page of products that `usePaginatedQuery` will request. If
 * these two ever disagreed, the server-rendered grid would visibly reshuffle
 * when the live query resolved.
 */
export const STORE_ITEMS_PER_PAGE = 9;

/** Sort applied to the store's default (unfiltered) first page. */
export const STORE_DEFAULT_SORT = "newest" as const;