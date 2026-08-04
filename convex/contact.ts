import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAdminSilent } from "./users";
import { checkRateLimit } from "./rateLimit";
import { auditLog } from "./lib/audit";

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    // Rate limit: max 3 contact messages per email per hour
    await checkRateLimit(ctx, "contact", email, 3, 3_600_000);

    if (args.message.length > 5000) {
      throw new Error("Message is too long");
    }

    const id = await ctx.db.insert("contactMessages", {
      name: args.name.trim().slice(0, 120),
      email,
      subject: args.subject?.trim().slice(0, 200),
      message: args.message.trim(),
      read: false,
      createdAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      type: "contact",
      title: "New Contact Message",
      message: `${args.name} (${email}): ${args.subject ?? args.message.slice(0, 80)}`,
      link: "/admin/support",
      read: false,
      createdAt: Date.now(),
    });

    return id;
  },
});

export const list = query({
  args: { unreadOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return [];
    const all = await ctx.db
      .query("contactMessages")
      .withIndex("by_createdAt")
      .order("desc")
      .take(100);
    if (args.unreadOnly) {
      return all.filter((m) => !m.read);
    }
    return all;
  },
});

export const markRead = mutation({
  args: { id: v.id("contactMessages") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, { read: true });
  },
});

export const remove = mutation({
  args: { id: v.id("contactMessages") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const msg = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await auditLog(ctx, {
      action: "contact.delete",
      entityType: "contactMessage",
      entityId: args.id,
      summary: `Deleted contact message from "${msg?.name ?? msg?.email ?? "unknown"}"`,
    });
  },
});
