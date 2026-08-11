/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as abandonedCarts from "../abandonedCarts.js";
import type * as analytics from "../analytics.js";
import type * as analyticsEvents from "../analyticsEvents.js";
import type * as auditLogExport from "../auditLogExport.js";
import type * as auditLogs from "../auditLogs.js";
import type * as campaigns from "../campaigns.js";
import type * as cartRecovery from "../cartRecovery.js";
import type * as carts from "../carts.js";
import type * as categories from "../categories.js";
import type * as checkout from "../checkout.js";
import type * as clerk from "../clerk.js";
import type * as contact from "../contact.js";
import type * as coupons from "../coupons.js";
import type * as crons from "../crons.js";
import type * as customers from "../customers.js";
import type * as downloads from "../downloads.js";
import type * as email from "../email.js";
import type * as emailTemplates from "../emailTemplates.js";
import type * as fulfillment from "../fulfillment.js";
import type * as gdpr from "../gdpr.js";
import type * as http from "../http.js";
import type * as invitations from "../invitations.js";
import type * as lib_audit from "../lib/audit.js";
import type * as licenses from "../licenses.js";
import type * as mediaFiles from "../mediaFiles.js";
import type * as notifications from "../notifications.js";
import type * as orderEmails from "../orderEmails.js";
import type * as orders from "../orders.js";
import type * as pages from "../pages.js";
import type * as payments from "../payments.js";
import type * as pesapal from "../pesapal.js";
import type * as products from "../products.js";
import type * as rateLimit from "../rateLimit.js";
import type * as refunds from "../refunds.js";
import type * as resources from "../resources.js";
import type * as returns from "../returns.js";
import type * as returnsInternal from "../returnsInternal.js";
import type * as reviews from "../reviews.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";
import type * as settingsSchema from "../settingsSchema.js";
import type * as storage from "../storage.js";
import type * as stripe from "../stripe.js";
import type * as subscribers from "../subscribers.js";
import type * as testSmtp from "../testSmtp.js";
import type * as users from "../users.js";
import type * as webhooks from "../webhooks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  abandonedCarts: typeof abandonedCarts;
  analytics: typeof analytics;
  analyticsEvents: typeof analyticsEvents;
  auditLogExport: typeof auditLogExport;
  auditLogs: typeof auditLogs;
  campaigns: typeof campaigns;
  cartRecovery: typeof cartRecovery;
  carts: typeof carts;
  categories: typeof categories;
  checkout: typeof checkout;
  clerk: typeof clerk;
  contact: typeof contact;
  coupons: typeof coupons;
  crons: typeof crons;
  customers: typeof customers;
  downloads: typeof downloads;
  email: typeof email;
  emailTemplates: typeof emailTemplates;
  fulfillment: typeof fulfillment;
  gdpr: typeof gdpr;
  http: typeof http;
  invitations: typeof invitations;
  "lib/audit": typeof lib_audit;
  licenses: typeof licenses;
  mediaFiles: typeof mediaFiles;
  notifications: typeof notifications;
  orderEmails: typeof orderEmails;
  orders: typeof orders;
  pages: typeof pages;
  payments: typeof payments;
  pesapal: typeof pesapal;
  products: typeof products;
  rateLimit: typeof rateLimit;
  refunds: typeof refunds;
  resources: typeof resources;
  returns: typeof returns;
  returnsInternal: typeof returnsInternal;
  reviews: typeof reviews;
  seed: typeof seed;
  settings: typeof settings;
  settingsSchema: typeof settingsSchema;
  storage: typeof storage;
  stripe: typeof stripe;
  subscribers: typeof subscribers;
  testSmtp: typeof testSmtp;
  users: typeof users;
  webhooks: typeof webhooks;
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
