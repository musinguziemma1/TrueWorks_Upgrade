/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("payment webhook processing claims", () => {
  test("allows one active processor and permits retry after release", async () => {
    const t = convexTest(schema, modules);
    const args = { provider: "pesapal", eventId: "pesapal-tracking-1" };

    expect(await t.mutation(internal.webhooks.claimEventProcessing, args)).toBe("claimed");
    expect(await t.mutation(internal.webhooks.claimEventProcessing, args)).toBe("busy");

    await t.mutation(internal.webhooks.releaseEventProcessing, args);
    expect(await t.mutation(internal.webhooks.claimEventProcessing, args)).toBe("claimed");
  });

  test("marks completed events as processed and preserves legacy processed rows", async () => {
    const t = convexTest(schema, modules);
    const args = { provider: "pesapal", eventId: "pesapal-tracking-2" };

    expect(await t.mutation(internal.webhooks.claimEventProcessing, args)).toBe("claimed");
    await t.mutation(internal.webhooks.markProcessed, args);
    expect(await t.mutation(internal.webhooks.claimEventProcessing, args)).toBe("processed");
    expect(await t.query(internal.webhooks.isProcessed, args)).toBe(true);

    await t.run(async (ctx) => {
      await ctx.db.insert("webhookEvents", {
        provider: "stripe",
        eventId: "legacy-stripe-event",
        createdAt: Date.now(),
      });
    });
    expect(
      await t.query(internal.webhooks.isProcessed, {
        provider: "stripe",
        eventId: "legacy-stripe-event",
      }),
    ).toBe(true);
  });
});
