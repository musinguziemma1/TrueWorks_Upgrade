import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    tokenIdentifier: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("customer")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_tokenIdentifier", ["tokenIdentifier"]),

  mediaFiles: defineTable({
    name: v.string(),
    contentType: v.string(),
    folder: v.string(),
    size: v.number(),
    storageId: v.id("_storage"),
    url: v.optional(v.string()),
    createdAt: v.number(),
  }),

  products: defineTable({
    name: v.string(),
    slug: v.string(),
    sku: v.string(),
    shortDescription: v.string(),
    description: v.string(),
    price: v.number(),
    salePrice: v.optional(v.number()),
    category: v.string(),
    industry: v.string(),
    fileType: v.string(),
    tags: v.array(v.string()),
    galleryImages: v.array(v.string()),
    thumbnail: v.string(),
    downloadableFile: v.optional(v.string()),
    fileSize: v.optional(v.string()),
    version: v.optional(v.string()),
    changelog: v.optional(v.string()),
    downloadLimit: v.optional(v.number()),
    downloadExpiry: v.optional(v.number()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    faqs: v.array(v.object({
      question: v.string(),
      answer: v.string(),
    })),
    demoVideo: v.optional(v.string()),
    featured: v.boolean(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    totalSales: v.number(),
    rating: v.number(),
    reviewCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["category"])
    .index("by_industry", ["industry"])
    .index("by_status", ["status"])
    .index("by_featured", ["featured"]),

  orders: defineTable({
    orderNumber: v.string(),
    customerId: v.optional(v.id("customers")),
    customerEmail: v.string(),
    customerName: v.string(),
    items: v.array(v.object({
      productId: v.id("products"),
      productName: v.string(),
      quantity: v.number(),
      price: v.number(),
    })),
    subtotal: v.number(),
    tax: v.number(),
    total: v.number(),
    paymentMethod: v.string(),
    paymentStatus: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("refunded")),
    orderStatus: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("cancelled")),
    downloadLinks: v.array(v.object({
      productId: v.id("products"),
      url: v.string(),
      expiresAt: v.number(),
      downloadCount: v.number(),
    })),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orderNumber", ["orderNumber"])
    .index("by_customerId", ["customerId"])
    .index("by_customerEmail", ["customerEmail"])
    .index("by_paymentStatus", ["paymentStatus"])
    .index("by_createdAt", ["createdAt"]),

  customers: defineTable({
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    avatar: v.optional(v.string()),
    newsletterSubscribed: v.boolean(),
    lifetimeValue: v.number(),
    totalOrders: v.number(),
    favoriteCategories: v.array(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"]),

  downloads: defineTable({
    productId: v.id("products"),
    customerId: v.optional(v.id("customers")),
    email: v.string(),
    downloadCount: v.number(),
    remainingDownloads: v.number(),
    expiresAt: v.number(),
    device: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("expired"), v.literal("disabled")),
    createdAt: v.number(),
  })
    .index("by_productId", ["productId"])
    .index("by_customerId", ["customerId"])
    .index("by_email", ["email"]),

  reviews: defineTable({
    productId: v.id("products"),
    customerId: v.optional(v.id("customers")),
    customerName: v.string(),
    rating: v.number(),
    title: v.optional(v.string()),
    content: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    featured: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_productId", ["productId"])
    .index("by_status", ["status"]),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    industry: v.optional(v.string()),
    icon: v.optional(v.string()),
    productCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"]),

  coupons: defineTable({
    code: v.string(),
    type: v.union(v.literal("percentage"), v.literal("fixed"), v.literal("bundle")),
    value: v.number(),
    minPurchase: v.optional(v.number()),
    usageLimit: v.optional(v.number()),
    usageCount: v.number(),
    expiresAt: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_code", ["code"]),

  pages: defineTable({
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    type: v.union(v.literal("page"), v.literal("post"), v.literal("resource")),
    excerpt: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    author: v.optional(v.string()),
    readingTime: v.optional(v.number()),
    status: v.union(v.literal("draft"), v.literal("published")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_type", ["type"])
    .index("by_status", ["status"]),

  subscribers: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    source: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"]),

  analytics: defineTable({
    date: v.string(),
    revenue: v.number(),
    orders: v.number(),
    downloads: v.number(),
    visitors: v.number(),
    pageViews: v.number(),
    createdAt: v.number(),
  })
    .index("by_date", ["date"]),

  settings: defineTable({
    key: v.string(),
    value: v.any(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"]),

  resources: defineTable({
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    content: v.string(),
    category: v.string(),
    type: v.union(v.literal("document"), v.literal("video"), v.literal("link"), v.literal("download")),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    featured: v.boolean(),
    externalUrl: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    tags: v.array(v.string()),
    downloadCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_featured", ["featured"]),

  notifications: defineTable({
    type: v.string(),
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    link: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_read", ["read"])
    .index("by_createdAt", ["createdAt"]),
});
