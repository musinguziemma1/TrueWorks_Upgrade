import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAdminSilent } from "./users";

export const list = query({
  args: {
    search: v.optional(v.string()),
    newsletterSubscribed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return [];
    if (args.newsletterSubscribed !== undefined) {
      const all = await ctx.db.query("customers").collect();
      return all.filter((c) => c.newsletterSubscribed === args.newsletterSubscribed);
    }
    if (args.search) {
      const lower = args.search.toLowerCase();
      const all = await ctx.db.query("customers").collect();
      return all.filter((c) =>
        c.name.toLowerCase().includes(lower) ||
        c.email.toLowerCase().includes(lower) ||
        (c.phone ?? "").includes(lower)
      );
    }
    return await ctx.db.query("customers").order("desc").take(100);
  },
});

export const getById = query({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return null;
    return await ctx.db.get(args.id);
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return null;
    const results = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
    return results[0] ?? null;
  },
});

export const create = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    avatar: v.optional(v.string()),
    newsletterSubscribed: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
    if (existing.length > 0) {
      throw new Error(`Customer with email "${args.email}" already exists`);
    }
    const now = Date.now();
    const id = await ctx.db.insert("customers", {
      ...args,
      lifetimeValue: 0,
      totalOrders: 0,
      favoriteCategories: [],
      createdAt: now,
      updatedAt: now,
    });
    const { auditLog } = await import("./lib/audit");
    await auditLog(ctx, {
      action: "customer.create",
      entityType: "customer",
      entityId: id,
      summary: `Created customer "${args.name}" (${args.email})`,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("customers"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatar: v.optional(v.string()),
    newsletterSubscribed: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    lifetimeValue: v.optional(v.number()),
    totalOrders: v.optional(v.number()),
    favoriteCategories: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
    const old = await ctx.db.get(id);
    await ctx.db.patch(id, { ...filtered, updatedAt: Date.now() });
    const { auditLog } = await import("./lib/audit");
    await auditLog(ctx, {
      action: "customer.update",
      entityType: "customer",
      entityId: id,
      summary: `Updated customer "${old?.name ?? id}"`,
      changes: filtered,
    });
  },
});

export const upsertPublic = internalMutation({
  args: {
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
    const now = Date.now();
    if (existing.length > 0) {
      await ctx.db.patch(existing[0]._id, {
        name: args.name,
        phone: args.phone ?? existing[0].phone,
        updatedAt: now,
      });
      return existing[0]._id;
    }
    return await ctx.db.insert("customers", {
      email: args.email,
      name: args.name,
      phone: args.phone,
      newsletterSubscribed: false,
      lifetimeValue: 0,
      totalOrders: 0,
      favoriteCategories: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const customer = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    const { auditLog } = await import("./lib/audit");
    await auditLog(ctx, {
      action: "customer.delete",
      entityType: "customer",
      entityId: args.id,
      summary: `Deleted customer "${customer?.name ?? args.id}"`,
    });
  },
});
