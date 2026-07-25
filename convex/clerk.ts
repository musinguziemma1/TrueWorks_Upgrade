"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export const syncRoleToClerk = internalAction({
  args: {
    clerkId: v.string(),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("editor"), v.literal("viewer")),
  },
  handler: async (_ctx, args) => {
    const secret = process.env.CLERK_SECRET_KEY;
    if (!secret) return null;

    const res = await fetch(
      `https://api.clerk.com/v1/users/${args.clerkId}/metadata`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ public_metadata: { role: args.role } }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Clerk metadata sync failed (${res.status}): ${text}`);
    }
    return null;
  },
});

export const suspendClerkUser = internalAction({
  args: { clerkId: v.string() },
  handler: async (_ctx, args) => {
    const secret = process.env.CLERK_SECRET_KEY;
    if (!secret) return null;

    const res = await fetch(
      `https://api.clerk.com/v1/users/${args.clerkId}/disable`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Clerk suspend failed (${res.status}): ${text}`);
    }
    return null;
  },
});

export const activateClerkUser = internalAction({
  args: { clerkId: v.string() },
  handler: async (_ctx, args) => {
    const secret = process.env.CLERK_SECRET_KEY;
    if (!secret) return null;

    const res = await fetch(
      `https://api.clerk.com/v1/users/${args.clerkId}/enable`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Clerk activate failed (${res.status}): ${text}`);
    }
    return null;
  },
});

export const deleteClerkUser = internalAction({
  args: { clerkId: v.string() },
  handler: async (_ctx, args) => {
    const secret = process.env.CLERK_SECRET_KEY;
    if (!secret) return null;

    const res = await fetch(
      `https://api.clerk.com/v1/users/${args.clerkId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${secret}`,
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Clerk delete failed (${res.status}): ${text}`);
    }
    return null;
  },
});

export const inviteClerkUser = internalAction({
  args: {
    email: v.string(),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("editor"), v.literal("viewer")),
  },
  handler: async (_ctx, args) => {
    const secret = process.env.CLERK_SECRET_KEY;
    if (!secret) throw new Error("Missing CLERK_SECRET_KEY");

    const res = await fetch(
      `https://api.clerk.com/v1/invitations`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_address: args.email,
          public_metadata: { role: args.role },
          redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/sign-in`,
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Clerk invite failed (${res.status}): ${text}`);
    }
    return await res.json();
  },
});
