import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAdminSilent, requireEditor } from "./users";

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  description: string;
  variables: string[];
}

export const templates: EmailTemplate[] = [
  {
    id: "order-confirmation",
    name: "Order Confirmation",
    subject: "Order Confirmed - {{orderNumber}}",
    description: "Sent when a customer completes a purchase",
    variables: ["{{customerName}}", "{{orderNumber}}", "{{items}}", "{{total}}"],
  },
  {
    id: "download-ready",
    name: "Download Ready",
    subject: "Payment Approved — Download Ready ({{orderNumber}})",
    description: "Sent when payment is confirmed and download is available",
    variables: ["{{customerName}}", "{{orderNumber}}", "{{productName}}", "{{downloadUrl}}"],
  },
  {
    id: "payment-failed",
    name: "Payment Failed",
    subject: "Payment Failed - {{orderNumber}}",
    description: "Sent when a payment attempt fails",
    variables: ["{{customerName}}", "{{orderNumber}}", "{{amount}}"],
  },
  {
    id: "refund-confirmation",
    name: "Refund Confirmation",
    subject: "Refund Processed - {{orderNumber}}",
    description: "Sent when a refund is processed",
    variables: ["{{customerName}}", "{{orderNumber}}", "{{amount}}", "{{reason}}"],
  },
  {
    id: "welcome",
    name: "Welcome Email",
    subject: "Welcome to TrueWorks!",
    description: "Sent to new customers after first purchase",
    variables: ["{{customerName}}"],
  },
  {
    id: "subscriber-welcome",
    name: "Subscriber Welcome",
    subject: "Welcome to TrueWorks — You're In!",
    description: "Sent to new newsletter subscribers",
    variables: ["{{subscriberName}}"],
  },
  {
    id: "team-invitation",
    name: "Team Invitation",
    subject: "You've Been Invited to Join TrueWorks",
    description: "Sent when an admin invites a team member",
    variables: ["{{invitedBy}}", "{{role}}", "{{expiryDate}}"],
  },
  {
    id: "abandoned-cart",
    name: "Abandoned Cart Recovery",
    subject: "You left items in your cart",
    description: "Sent to recover abandoned carts",
    variables: ["{{items}}", "{{totalValue}}"],
  },
];

export const listTemplates = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireAdminSilent(ctx))) return [];

    const overrides = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.gte("key", "emailTemplate:"))
      .collect();

    const overrideMap: Record<string, string> = {};
    for (const setting of overrides) {
      const templateId = setting.key.replace("emailTemplate:", "");
      overrideMap[templateId] = setting.value;
    }

    return templates.map((t) => ({
      ...t,
      isCustomized: !!overrideMap[t.id],
    }));
  },
});

export const getTemplate = query({
  args: { templateId: v.string() },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return null;

    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", `emailTemplate:${args.templateId}`))
      .first();

    const template = templates.find((t) => t.id === args.templateId);
    if (!template) return null;

    return {
      ...template,
      customSubject: setting?.value?.subject ?? template.subject,
      customHtml: setting?.value?.html ?? null,
    };
  },
});

export const saveTemplate = mutation({
  args: {
    templateId: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (ctx, args) => {
    await requireEditor(ctx);

    const template = templates.find((t) => t.id === args.templateId);
    if (!template) throw new Error("Template not found");

    const key = `emailTemplate:${args.templateId}`;
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: { subject: args.subject, html: args.html },
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("settings", {
        key,
        value: { subject: args.subject, html: args.html },
        updatedAt: Date.now(),
      });
    }
  },
});

export const resetTemplate = mutation({
  args: { templateId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const key = `emailTemplate:${args.templateId}`;
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
