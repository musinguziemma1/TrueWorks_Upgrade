"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export const syncRoleToClerk = internalAction({
  args: {
    clerkId: v.string(),
    role: v.union(v.literal("admin"), v.literal("customer")),
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
