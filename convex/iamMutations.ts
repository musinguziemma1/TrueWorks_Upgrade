import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { createSession, recordSecurityEvent } from "./lib/sessions";
import { normalizeEmail } from "./lib/tokens";

export const finalizeGoogleLogin = internalMutation({
  args: {
    email: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
    rawToken: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_normalizedEmail", (q) => q.eq("normalizedEmail", email))
      .first();

    let userId;
    let isNewUser = false;
    if (existing) {
      userId = existing._id;
      await ctx.db.patch(existing._id, {
        emailVerified: true,
        name: existing.name ?? args.name,
        avatar: existing.avatar ?? args.avatar,
        lastLoginAt: now,
        loginCount: (existing.loginCount ?? 0) + 1,
        updatedAt: now,
      });
    } else {
      isNewUser = true;
      const clerkId = `tw_${crypto.randomUUID()}`;
      userId = await ctx.db.insert("users", {
        clerkId,
        tokenIdentifier: `${process.env.CONVEX_AUTH_ISSUER ?? "https://trueworksgroup.com"}|${clerkId}`,
        email,
        normalizedEmail: email,
        emailVerified: true,
        name: args.name,
        avatar: args.avatar,
        role: "viewer",
        status: "active",
        createdAt: now,
        updatedAt: now,
        securityVersion: 0,
        loginCount: 1,
      });
    }

    await createSession(ctx, {
      userId,
      rawToken: args.rawToken,
      rememberMe: false,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });

    await recordSecurityEvent(ctx, {
      userId,
      action: "login",
      result: "success",
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      metadata: { provider: "google", newUser: isNewUser },
    });

    if (isNewUser) {
      await ctx.scheduler.runAfter(0, internal.email.sendIamWelcomeEmail, {
        to: email,
        name: args.name,
      });
    }

    return { userId, isNewUser };
  },
});
