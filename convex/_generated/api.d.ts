/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as categories from "../categories.js";
import type * as clerk from "../clerk.js";
import type * as coupons from "../coupons.js";
import type * as customers from "../customers.js";
import type * as downloads from "../downloads.js";
import type * as http from "../http.js";
import type * as mediaFiles from "../mediaFiles.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as pages from "../pages.js";
import type * as products from "../products.js";
import type * as resources from "../resources.js";
import type * as reviews from "../reviews.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";
import type * as storage from "../storage.js";
import type * as subscribers from "../subscribers.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  categories: typeof categories;
  clerk: typeof clerk;
  coupons: typeof coupons;
  customers: typeof customers;
  downloads: typeof downloads;
  http: typeof http;
  mediaFiles: typeof mediaFiles;
  notifications: typeof notifications;
  orders: typeof orders;
  pages: typeof pages;
  products: typeof products;
  resources: typeof resources;
  reviews: typeof reviews;
  seed: typeof seed;
  settings: typeof settings;
  storage: typeof storage;
  subscribers: typeof subscribers;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
