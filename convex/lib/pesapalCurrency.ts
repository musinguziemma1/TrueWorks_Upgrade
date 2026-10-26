export function normalizeCurrencyCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const currency = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : null;
}

const COUNTRY_CURRENCY: Record<string, string> = {
  UG: "UGX",
  KE: "KES",
  TZ: "TZS",
  RW: "RWF",
  SS: "SSP",
  NG: "NGN",
  GH: "GHS",
  ZA: "ZAR",
};

export function resolveSettlementCurrency(
  reportedCurrency: unknown,
  paymentMethod: unknown,
): { currency: string | null; source: "payment_method" | "gateway" | null } {
  if (typeof paymentMethod === "string") {
    // Pesapal may retain the requested currency in `currency` while reporting
    // the actual local mobile-money rail in `payment_method`.
    const match = paymentMethod.trim().toUpperCase().match(
      /(?:^|[^A-Z])(?:AIRTEL|MTN|SAFARICOM|M-?PESA|TIGO|VODACOM|HALOPESA|ORANGE|MOOV|WAVE|MOMO)[ _-]*([A-Z]{2})$/,
    );
    const methodCurrency = match ? COUNTRY_CURRENCY[match[1]] : null;
    if (methodCurrency) return { currency: methodCurrency, source: "payment_method" };
  }
  const currency = normalizeCurrencyCode(reportedCurrency);
  return {
    currency,
    source: currency ? "gateway" : null,
  };
}

export function parseSettlementAmount(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !/^\d+(?:\.\d+)?$/.test(value.trim())) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

export function currencyMinorUnits(currency: string): number | null {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? null;
  } catch {
    return null;
  }
}

export function toMinorUnits(amount: number, currency: string): number | null {
  const fractionDigits = currencyMinorUnits(currency);
  if (fractionDigits === null || !Number.isFinite(amount) || amount < 0) return null;
  const minorUnits = Math.round(amount * 10 ** fractionDigits);
  return Number.isSafeInteger(minorUnits) ? minorUnits : null;
}

export function convertSettlementAmount(
  amount: number,
  sourceCurrency: string,
  targetCurrency: string,
  targetRate: number | undefined,
): { amount: number; rate: number } | null {
  if (sourceCurrency === targetCurrency) return { amount, rate: 1 };
  if (typeof targetRate !== "number" || !Number.isFinite(targetRate) || targetRate <= 0) return null;
  const converted = amount * targetRate;
  return Number.isFinite(converted) ? { amount: converted, rate: targetRate } : null;
}
