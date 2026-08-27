"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export type ProductStatus = "draft" | "published" | "archived";

export interface ProductInput {
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  price: number;
  salePrice?: number;
  category: string;
  industry: string;
  fileType: string;
  tags: string[];
  galleryImages: string[];
  thumbnail: string;
  downloadableFile?: string;
  downloadableFileStorageId?: Id<"_storage">;
  fileSize?: string;
  version?: string;
  changelog?: string;
  downloadLimit?: number;
  downloadExpiry?: number;
  requiresLicense?: boolean;
  licenseKeyCount?: number;
  activationLimit?: number;
  seoTitle?: string;
  seoDescription?: string;
  faqs: { question: string; answer: string }[];
  demoVideo?: string;
  featured: boolean;
  status: ProductStatus;
}

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string;
  industry?: string;
  icon?: string;
}

export interface CouponInput {
  code: string;
  type: "percentage" | "fixed" | "bundle";
  value: number;
  minPurchase?: number;
  usageLimit?: number;
  expiresAt?: number;
  isActive: boolean;
}

export function useProducts(args?: {
  category?: string;
  industry?: string;
  status?: string;
  search?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}) {
  return useQuery(api.products.list, args ?? {}) ?? { items: [], total: 0 };
}

export function useProduct(id: Id<"products">) {
  return useQuery(api.products.getById, { id });
}

export function useProductStats() {
  return useQuery(api.products.stats);
}

export const createProduct = {
  useMutation: () => useMutation(api.products.create),
};

export const updateProduct = {
  useMutation: () => useMutation(api.products.update),
};

export const deleteProduct = {
  useMutation: () => useMutation(api.products.remove),
};

export const bulkImportProducts = {
  useMutation: () => useMutation(api.products.bulkImport),
};

export function useCategories(industry?: string) {
  return useQuery(api.categories.list, { industry });
}

export const createCategory = {
  useMutation: () => useMutation(api.categories.create),
};

export const updateCategory = {
  useMutation: () => useMutation(api.categories.update),
};

export const deleteCategory = {
  useMutation: () => useMutation(api.categories.remove),
};

export function useOrders(args?: {
  paymentStatus?: string;
  orderStatus?: string;
  search?: string;
  startDate?: number;
  endDate?: number;
  daysAgo?: number;
  limit?: number;
}) {
  return useQuery(api.orders.list, args ?? {});
}

export function useOrder(id: Id<"orders">) {
  return useQuery(api.orders.getById, { id });
}

export function useOrderStats() {
  return useQuery(api.orders.stats);
}

export const createOrder = {
  useMutation: () => useMutation(api.orders.create),
};

export const updateOrderStatus = {
  useMutation: () => useMutation(api.orders.updateStatus),
};

export const deleteOrder = {
  useMutation: () => useMutation(api.orders.remove),
};

export function useCustomers(args?: { search?: string; newsletterSubscribed?: boolean }) {
  return useQuery(api.customers.list, args ?? {});
}

export function useCustomer(id: Id<"customers">) {
  return useQuery(api.customers.getById, { id });
}

export const createCustomer = {
  useMutation: () => useMutation(api.customers.create),
};

export const updateCustomer = {
  useMutation: () => useMutation(api.customers.update),
};

export const deleteCustomer = {
  useMutation: () => useMutation(api.customers.remove),
};

export function useReviews(args?: { productId?: Id<"products">; status?: string; search?: string }) {
  return useQuery(api.reviews.list, args ?? {});
}

export const approveReview = {
  useMutation: () => useMutation(api.reviews.approve),
};

export const rejectReview = {
  useMutation: () => useMutation(api.reviews.reject),
};

export const toggleFeaturedReview = {
  useMutation: () => useMutation(api.reviews.toggleFeatured),
};

export const deleteReview = {
  useMutation: () => useMutation(api.reviews.remove),
};

export function useCoupons(activeOnly?: boolean) {
  return useQuery(api.coupons.list, { activeOnly });
}

export const createCoupon = {
  useMutation: () => useMutation(api.coupons.create),
};

export const updateCoupon = {
  useMutation: () => useMutation(api.coupons.update),
};

export const deleteCoupon = {
  useMutation: () => useMutation(api.coupons.remove),
};

export function usePages(args?: { type?: "page" | "post" | "resource"; status?: string }) {
  return useQuery(api.pages.list, args ? { type: args.type } : {});
}

export const createPage = {
  useMutation: () => useMutation(api.pages.create),
};

export const updatePage = {
  useMutation: () => useMutation(api.pages.update),
};

export const deletePage = {
  useMutation: () => useMutation(api.pages.remove),
};

export function useSubscribers(activeOnly?: boolean) {
  return useQuery(api.subscribers.list, { activeOnly });
}

export const createSubscriber = {
  useMutation: () => useMutation(api.subscribers.create),
};

export const unsubscribeSubscriber = {
  useMutation: () => useMutation(api.subscribers.unsubscribe),
};

export const deleteSubscriber = {
  useMutation: () => useMutation(api.subscribers.remove),
};

export function useNotifications(unreadOnly?: boolean) {
  return useQuery(api.notifications.list, { unreadOnly });
}

export function useNotificationCount() {
  return useQuery(api.notifications.count);
}

export const createNotification = {
  useMutation: () => useMutation(api.notifications.create),
};

export const markNotificationRead = {
  useMutation: () => useMutation(api.notifications.markRead),
};

export const markAllNotificationsRead = {
  useMutation: () => useMutation(api.notifications.markAllRead),
};

export const deleteNotification = {
  useMutation: () => useMutation(api.notifications.remove),
};

export type ResourceType = "document" | "video" | "link" | "download";
export type ResourceStatus = "draft" | "published" | "archived";

export interface ResourceInput {
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  type: ResourceType;
  status: ResourceStatus;
  featured: boolean;
  featuredImage?: string;
  attachments: { name: string; url: string; size: number }[];
  externalUrl?: string;
  thumbnail?: string;
  tags: string[];
}

export function useResources(args?: {
  category?: string;
  status?: string;
  search?: string;
  featured?: boolean;
}) {
  return useQuery(api.resources.list, args ?? {});
}

export function useResource(id: Id<"resources">) {
  return useQuery(api.resources.getById, { id });
}

export function useResourceStats() {
  return useQuery(api.resources.stats);
}

export const createResource = {
  useMutation: () => useMutation(api.resources.create),
};

export const updateResource = {
  useMutation: () => useMutation(api.resources.update),
};

export const deleteResource = {
  useMutation: () => useMutation(api.resources.remove),
};

export const duplicateResource = {
  useMutation: () => useMutation(api.resources.duplicate),
};

export function useMediaFiles(folder?: string) {
  return useQuery(api.storage.listFiles, { folder: folder ?? "" });
}

export const uploadFile = {
  useAction: () => useAction(api.storage.uploadFile),
};

export const deleteMediaFile = {
  useMutation: () => useMutation(api.storage.deleteFile),
};

export const getFileUrl = {
  useAction: () => useAction(api.storage.getFileUrl),
};
