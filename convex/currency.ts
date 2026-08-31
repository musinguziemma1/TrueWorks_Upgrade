import { action, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const EXCHANGE_RATES_CACHE_KEY = "exchangeRatesCache";

interface RateCache {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
}

export const getExchangeRates = action({
  args: { base: v.optional(v.string()) },
  handler: async (ctx, args): Promise<RateCache> => {
    const base = (args.base ?? "USD").toUpperCase();

    const cached = await ctx.runQuery(internal.settings.getInternal, {
      key: EXCHANGE_RATES_CACHE_KEY,
    });
    if (cached && typeof cached === "object" && "rates" in cached && "fetchedAt" in cached) {
      const c = cached as RateCache;
      if (c.base === base && Date.now() - c.fetchedAt < 60 * 60 * 1000) {
        return c;
      }
    }

    try {
      const res = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${base}`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) throw new Error(`Exchange rate API returned ${res.status}`);
      const data = (await res.json()) as { base: string; rates: Record<string, number> };
      const result: RateCache = { base: data.base, rates: data.rates, fetchedAt: Date.now() };
      await ctx.runMutation(internal.settings.setInternal, {
        key: EXCHANGE_RATES_CACHE_KEY,
        value: result,
      });
      return result;
    } catch {
      const fallback: RateCache = {
        base,
        rates: { USD: 1, UGX: 3700, KES: 150, EUR: 0.92, GBP: 0.79 },
        fetchedAt: Date.now(),
      };
      return fallback;
    }
  },
});

export const calculateTax = query({
  args: {
    amount: v.number(),
    taxRate: v.number(),
    currency: v.string(),
  },
  handler: async (_ctx, args) => {
    const taxAmount = Math.round(args.amount * (args.taxRate / 100) * 100) / 100;
    const total = Math.round((args.amount + taxAmount) * 100) / 100;
    return {
      subtotal: args.amount,
      taxRate: args.taxRate,
      taxAmount,
      total,
      currency: args.currency,
    };
  },
});
