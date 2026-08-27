import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.optional(v.string()),
    tokenIdentifier: v.string(),
    email: v.string(),
    normalizedEmail: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
    passwordHash: v.optional(v.string()),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    role: v.union(v.literal("superadmin"), v.literal("owner"), v.literal("admin"), v.literal("editor"), v.literal("viewer")),
    status: v.optional(v.union(v.literal("active"), v.literal("suspended"))),
    lastLoginAt: v.optional(v.number()),
    loginCount: v.optional(v.number()),
    lastPasswordChangeAt: v.optional(v.number()),
    securityVersion: v.optional(v.number()),
    failedLoginCount: v.optional(v.number()),
    lockedUntil: v.optional(v.number()),
    mfaEnabled: v.optional(v.boolean()),
    marketingOptIn: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_normalizedEmail", ["normalizedEmail"]),

  sessions: defineTable({
    tokenHash: v.string(),
    userId: v.id("users"),
    createdAt: v.number(),
    lastActiveAt: v.number(),
    idleExpiresAt: v.number(),
    absoluteExpiresAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    city: v.optional(v.string()),
    region: v.optional(v.string()),
    country: v.optional(v.string()),
    revoked: v.boolean(),
    revokedAt: v.optional(v.number()),
    refreshedAt: v.optional(v.number()),
  })
    .index("by_tokenHash", ["tokenHash"])
    .index("by_userId", ["userId"])
    .index("by_userId_revoked", ["userId", "revoked"]),

  verificationTokens: defineTable({
    email: v.string(),
    tokenHash: v.string(),
    type: v.string(),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_tokenHash", ["tokenHash"])
    .index("by_email_type", ["email", "type"]),

  passwordResetTokens: defineTable({
    email: v.string(),
    tokenHash: v.string(),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_tokenHash", ["tokenHash"])
    .index("by_email", ["email"]),

  mfaFactors: defineTable({
    userId: v.id("users"),
    secret: v.string(),
    verified: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"]),

  recoveryCodes: defineTable({
    userId: v.id("users"),
    codeHash: v.string(),
    used: v.boolean(),
    usedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_userId_used", ["userId", "used"])
    .index("by_codeHash", ["codeHash"]),

  // WebAuthn / passkey credentials registered by users.
  // credentialId is the base64url-encoded unique credential ID.
  passkeyCredentials: defineTable({
    userId: v.id("users"),
    credentialId: v.string(),
    publicKey: v.string(), // base64url-encoded CBOR public key
    counter: v.number(),
    transports: v.optional(v.array(v.string())),
    deviceType: v.optional(v.string()), // "singleDevice" | "multiDevice"
    backedUp: v.optional(v.boolean()),
    name: v.optional(v.string()),
    lastUsedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_credentialId", ["credentialId"])
    .index("by_userId", ["userId"]),

  // Short-lived WebAuthn challenges (registration + authentication).
  // The challenge itself never travels to the client storage — only its hash —
  // and each challenge is consumed exactly once.
  webauthnChallenges: defineTable({
    challengeHash: v.string(),
    type: v.string(), // "passkey_reg" | "passkey_auth"
    email: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    expiresAt: v.number(),
    createdAt: v.number(),
  }).index("by_challengeHash", ["challengeHash"]),

  securityEvents: defineTable({
    userId: v.id("users"),
    actorId: v.optional(v.id("users")),
    action: v.string(),
    result: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    city: v.optional(v.string()),
    region: v.optional(v.string()),
    country: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_createdAt", ["createdAt"]),

  loginAttempts: defineTable({
    email: v.string(),
    success: v.boolean(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_createdAt", ["createdAt"]),


  mediaFiles: defineTable({
    name: v.string(),
    contentType: v.string(),
    folder: v.string(),
    size: v.number(),
    storageId: v.id("_storage"),
    url: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_folder", ["folder"]),

  products: defineTable({
    name: v.string(),
    slug: v.string(),
    sku: v.string(),
    shortDescription: v.string(),
    description: v.string(),
    price: v.number(),
    salePrice: v.optional(v.number()),
    pricingTiers: v.optional(v.array(
      v.object({
        name: v.string(),
        price: v.number(),
        salePrice: v.optional(v.number()),
        quantity: v.optional(v.number()),
      })
    )),
    category: v.string(),
    industry: v.string(),
    fileType: v.string(),
    tags: v.array(v.string()),
    galleryImages: v.array(v.string()),
    thumbnail: v.string(),
    downloadableFile: v.optional(v.string()),
    downloadableFileStorageId: v.optional(v.id("_storage")),
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
    relatedProductIds: v.optional(v.array(v.id("products"))),
    upsellIds: v.optional(v.array(v.id("products"))),
    bundleProductIds: v.optional(v.array(v.id("products"))),
    versionHistory: v.optional(v.array(v.object({
      version: v.string(),
      changelog: v.string(),
      updatedAt: v.number(),
    }))),
    requiresLicense: v.optional(v.boolean()),
    licenseKeyCount: v.optional(v.number()),
    activationLimit: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["category"])
    .index("by_industry", ["industry"])
    .index("by_status", ["status"])
    .index("by_featured", ["featured"])
    .index("by_price", ["price"])
    .index("by_name", ["name"])
    .index("by_rating", ["rating"])
    .index("by_total_sales", ["totalSales"])
    .index("by_salePrice", ["salePrice"])
    .searchIndex("search_products", {
      searchField: "name",
      filterFields: ["status", "category", "industry", "fileType", "featured"],
    }),

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
    discountAmount: v.optional(v.number()),
    total: v.number(),
    paymentMethod: v.string(),
    paymentStatus: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("refunded")),
    orderStatus: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("cancelled")),
    paymentId: v.optional(v.string()),
    couponCode: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    country: v.optional(v.string()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    billingAddress: v.optional(v.object({
      street: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      country: v.optional(v.string()),
      postalCode: v.optional(v.string()),
    })),
    // Download grants for this order. Signed file URLs are NEVER persisted by
    // the current flow — they are generated on demand by the secure downloads
    // flow (convex/downloads.ts -> ctx.storage.getUrl), because stored URLs
    // expire and leak long-lived access in the database.
    // `url` / `expiresAt` are optional legacy fields kept only so older
    // documents still validate against this schema.
    downloadLinks: v.array(v.object({
      productId: v.id("products"),
      downloadCount: v.number(),
      expiresAt: v.optional(v.number()),
      url: v.optional(v.string()),
    })),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orderNumber", ["orderNumber"])
    .index("by_customerId", ["customerId"])
    .index("by_customerEmail", ["customerEmail"])
    .index("by_customerEmail_createdAt", ["customerEmail", "createdAt"])
    .index("by_paymentStatus", ["paymentStatus"])
    .index("by_orderStatus", ["orderStatus"])
    .index("by_status_createdAt", ["orderStatus", "createdAt"])
    .index("by_paymentStatus_createdAt", ["paymentStatus", "createdAt"])
    .index("by_paymentId", ["paymentId"])
    .index("by_createdAt", ["createdAt"]),

  customers: defineTable({
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    avatar: v.optional(v.string()),
    clerkId: v.optional(v.string()),
    newsletterSubscribed: v.boolean(),
    marketingOptIn: v.optional(v.boolean()),
    lifetimeValue: v.number(),
    totalOrders: v.number(),
    favoriteCategories: v.array(v.string()),
    lastLoginAt: v.optional(v.number()),
    loginCount: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_clerkId", ["clerkId"])
    .index("by_newsletterSubscribed", ["newsletterSubscribed"]),

  downloads: defineTable({
    productId: v.id("products"),
    customerId: v.optional(v.id("customers")),
    orderId: v.optional(v.id("orders")),
    email: v.string(),
    downloadCount: v.number(),
    remainingDownloads: v.number(),
    expiresAt: v.number(),
    downloadUrl: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    browser: v.optional(v.string()),
    device: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    location: v.optional(v.string()),
    revoked: v.optional(v.boolean()),
    status: v.union(v.literal("active"), v.literal("expired"), v.literal("disabled")),
    createdAt: v.number(),
  })
    .index("by_productId", ["productId"])
    .index("by_customerId", ["customerId"])
    .index("by_email", ["email"])
    .index("by_orderId", ["orderId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  licenses: defineTable({
    key: v.string(),
    productId: v.id("products"),
    productName: v.string(),
    email: v.string(),
    orderId: v.optional(v.id("orders")),
    status: v.union(v.literal("active"), v.literal("revoked")),
    maxActivations: v.number(),
    activations: v.number(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_key", ["key"])
    .index("by_productId", ["productId"])
    .index("by_orderId", ["orderId"]),

  reviews: defineTable({
    productId: v.id("products"),
    customerId: v.optional(v.id("customers")),
    customerName: v.string(),
    rating: v.number(),
    title: v.optional(v.string()),
    content: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    featured: v.boolean(),
    verified: v.optional(v.boolean()),
    helpfulCount: v.optional(v.number()),
    reported: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_productId", ["productId"])
    .index("by_status", ["status"])
    .index("by_customerId", ["customerId"]),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    industry: v.optional(v.string()),
    icon: v.optional(v.string()),
    productCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_industry", ["industry"]),

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
    .index("by_code", ["code"])
    .index("by_isActive", ["isActive"])
    .index("by_expiresAt", ["expiresAt"]),

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

  analyticsEvents: defineTable({
    event: v.string(), // e.g. "view_product", "add_to_cart", "reach_checkout", "payment_start", "purchase"
    sessionId: v.optional(v.string()),
    productId: v.optional(v.id("products")),
    productName: v.optional(v.string()),
    category: v.optional(v.string()),
    value: v.optional(v.number()),
    path: v.optional(v.string()),
    referrer: v.optional(v.string()),
    email: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_event", ["event"])
    .index("by_productId", ["productId"])
    .index("by_createdAt", ["createdAt"]),

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
    featuredImage: v.optional(v.string()),
    attachments: v.optional(v.array(v.object({
      name: v.string(),
      url: v.string(),
      size: v.number(),
    }))),
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
    .index("by_featured", ["featured"])
    .searchIndex("search_resources", {
      searchField: "title",
      filterFields: ["status", "category", "type", "featured"],
    }),

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

  payments: defineTable({
    orderId: v.id("orders"),
    paymentId: v.string(),
    provider: v.string(),
    method: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("refunded")),
    customerEmail: v.string(),
    customerName: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orderId", ["orderId"])
    .index("by_paymentId", ["paymentId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  auditLogs: defineTable({
    actorId: v.optional(v.id("users")),
    actorEmail: v.string(),
    actorName: v.optional(v.string()),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    summary: v.string(),
    changes: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    createdAt: v.number(),
    level: v.optional(v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("error"),
      v.literal("critical"),
    )),
    source: v.optional(v.union(
      v.literal("mutation"),
      v.literal("query"),
      v.literal("http"),
      v.literal("webhook"),
      v.literal("action"),
      v.literal("scheduler"),
    )),
    latencyMs: v.optional(v.number()),
    stackTrace: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })
    .index("by_actorId", ["actorId"])
    .index("by_entityType", ["entityType"])
    .index("by_entityType_createdAt", ["entityType", "createdAt"])
    .index("by_createdAt", ["createdAt"])
    .index("by_level", ["level"])
    .index("by_level_createdAt", ["level", "createdAt"])
    .index("by_action_level", ["action", "level"])
    .index("by_action_createdAt", ["action", "createdAt"])
    .index("by_actorEmail_createdAt", ["actorEmail", "createdAt"]),

  rateLimits: defineTable({
    key: v.string(), // `${action}:${identifier}`
    windowStart: v.number(),
    count: v.number(),
  }).index("by_key", ["key"]),

  contactMessages: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.optional(v.string()),
    message: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_read", ["read"]),

  carts: defineTable({
    clerkId: v.string(),
    items: v.array(v.object({
      id: v.string(),
      name: v.string(),
      price: v.number(),
      quantity: v.number(),
      image: v.string(),
      slug: v.string(),
      tier: v.optional(v.string()),
    })),
    wishlist: v.array(v.object({
      id: v.string(),
      name: v.string(),
      slug: v.string(),
      price: v.number(),
      image: v.string(),
    })),
    updatedAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  returns: defineTable({
    clerkId: v.string(),
    orderId: v.id("orders"),
    orderNumber: v.string(),
    customerEmail: v.string(),
    customerName: v.string(),
    items: v.array(v.object({
      productName: v.string(),
      quantity: v.number(),
      price: v.number(),
      reason: v.string(),
    })),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("completed"),
    ),
    notes: v.optional(v.string()),
    adminNotes: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    refundedAt: v.optional(v.number()),
    providerResult: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_orderId", ["orderId"])
    .index("by_status", ["status"])
    .index("by_customerEmail", ["customerEmail"]),

  invitations: defineTable({
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
    invitedBy: v.string(),
    invitedByName: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("revoked"), v.literal("expired")),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"]),

  campaigns: defineTable({
    name: v.string(),
    subject: v.string(),
    content: v.string(),
    status: v.union(v.literal("draft"), v.literal("scheduled"), v.literal("sending"), v.literal("sent")),
    scheduledAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    sentCount: v.number(),
    openCount: v.number(),
    clickCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  emailEvents: defineTable({
    campaignId: v.id("campaigns"),
    subscriberId: v.id("subscribers"),
    type: v.union(v.literal("open"), v.literal("click")),
    createdAt: v.number(),
  })
    .index("by_campaign_subscriber", ["campaignId", "subscriberId"])
    .index("by_campaign_type", ["campaignId", "type"]),

  abandonedCarts: defineTable({
    email: v.string(),
    items: v.array(v.object({
      id: v.string(),
      name: v.string(),
      price: v.number(),
      quantity: v.number(),
      image: v.string(),
      slug: v.string(),
    })),
    totalValue: v.number(),
    recovered: v.boolean(),
    recoveryEmailSentAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_recovered", ["recovered"])
    .index("by_createdAt", ["createdAt"]),

  apiKeys: defineTable({
    name: v.string(),
    keyPrefix: v.string(),
    keyHash: v.string(),
    enabled: v.boolean(),
    lastUsedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_keyHash", ["keyHash"]),

  webhookEndpoints: defineTable({
    url: v.string(),
    events: v.array(v.string()),
    enabled: v.boolean(),
    secret: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_enabled", ["enabled"]),

  webhookDeliveries: defineTable({
    endpointId: v.optional(v.id("webhookEndpoints")),
    event: v.string(),
    url: v.string(),
    status: v.union(v.literal("success"), v.literal("failed")),
    responseStatus: v.optional(v.number()),
    responseBody: v.optional(v.string()),
    payload: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"]),

  webhookEvents: defineTable({
    provider: v.string(),
    eventId: v.string(),
    createdAt: v.number(),
  })
    .index("by_eventId", ["eventId"]),
});
