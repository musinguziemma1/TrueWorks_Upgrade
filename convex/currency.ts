import { action, internalAction, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";

const EXCHANGE_RATES_CACHE_KEY = "exchangeRatesCache";
const EXCHANGE_RATES_TTL = 60 * 60 * 1000;

interface RateCache {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
}

const rateCacheValidator = v.object({
  base: v.string(),
  rates: v.record(v.string(), v.number()),
  fetchedAt: v.number(),
});

function parseRateCache(value: unknown): RateCache | null {
  if (!value || typeof value !== "object") return null;
  const cache = value as Partial<RateCache>;
  if (
    typeof cache.base !== "string" ||
    typeof cache.fetchedAt !== "number" ||
    !cache.rates ||
    typeof cache.rates !== "object" ||
    Array.isArray(cache.rates)
  ) {
    return null;
  }
  const rates = cache.rates as Record<string, unknown>;
  if (Object.values(rates).some((rate) => typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0)) {
    return null;
  }
  return {
    base: cache.base.toUpperCase(),
    rates: rates as Record<string, number>,
    fetchedAt: cache.fetchedAt,
  };
}

async function fetchExchangeRates(ctx: ActionCtx, requestedBase: string): Promise<RateCache> {
  const base = requestedBase.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(base)) throw new Error("Invalid exchange-rate currency");

  const cachedValue: unknown = await ctx.runQuery(internal.settings.getInternal, {
    key: EXCHANGE_RATES_CACHE_KEY,
  });
  const cached = parseRateCache(cachedValue);
  const now = Date.now();
  if (
    cached &&
    cached.base === base &&
    cached.fetchedAt <= now &&
    now - cached.fetchedAt < EXCHANGE_RATES_TTL
  ) {
    return cached;
  }

  const response = await fetch(
    `https://api.exchangerate-api.com/v4/latest/${base}`,
    { headers: { Accept: "application/json" } },
  );
  if (!response.ok) throw new Error(`Exchange rate API returned ${response.status}`);

  const data: unknown = await response.json();
  const result = parseRateCache(
    data && typeof data === "object"
      ? { ...(data as Record<string, unknown>), fetchedAt: Date.now() }
      : null,
  );
  if (!result || result.base.toUpperCase() !== base) {
    throw new Error("Exchange rate API returned invalid data");
  }

  await ctx.runMutation(internal.settings.setInternal, {
    key: EXCHANGE_RATES_CACHE_KEY,
    value: result,
  });
  return result;
}

export const getExchangeRates = action({
  args: { base: v.optional(v.string()) },
  returns: rateCacheValidator,
  handler: async (ctx, args): Promise<RateCache> => {
    return await fetchExchangeRates(ctx, args.base ?? "USD");
  },
});

export const getExchangeRatesInternal = internalAction({
  args: { base: v.string() },
  returns: rateCacheValidator,
  handler: async (ctx, args): Promise<RateCache> => {
    return await fetchExchangeRates(ctx, args.base);
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
