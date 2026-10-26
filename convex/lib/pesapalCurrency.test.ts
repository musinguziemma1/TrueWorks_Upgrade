import { describe, expect, test } from "vitest";
import {
  convertSettlementAmount,
  currencyMinorUnits,
  normalizeCurrencyCode,
  parseSettlementAmount,
  toMinorUnits,
} from "./pesapalCurrency";

describe("Pesapal settlement currency handling", () => {
  test("normalizes valid ISO-style currency codes and rejects malformed codes", () => {
    expect(normalizeCurrencyCode(" ugx ")).toBe("UGX");
    expect(normalizeCurrencyCode("US")).toBeNull();
    expect(normalizeCurrencyCode(undefined)).toBeNull();
  });

  test("accepts only finite, non-negative settlement amounts", () => {
    expect(parseSettlementAmount("1365.00")).toBe(1365);
    expect(parseSettlementAmount(-1)).toBeNull();
    expect(parseSettlementAmount("1,365.00")).toBeNull();
    expect(parseSettlementAmount(Number.NaN)).toBeNull();
  });

  test("converts settlement amounts using the requested target-currency rate", () => {
    expect(convertSettlementAmount(1365, "UGX", "USD", 0.0002271)).toEqual({
      amount: 0.3099915,
      rate: 0.0002271,
    });
    expect(convertSettlementAmount(0.31, "USD", "USD", undefined)).toEqual({
      amount: 0.31,
      rate: 1,
    });
    expect(convertSettlementAmount(1365, "UGX", "USD", undefined)).toBeNull();
  });

  test("compares using each currency's minor-unit precision", () => {
    expect(currencyMinorUnits("UGX")).toBe(0);
    expect(toMinorUnits(0.31, "USD")).toBe(31);
    expect(toMinorUnits(1365, "UGX")).toBe(1365);
    expect(toMinorUnits(0.31, "INVALID")).toBeNull();
  });
});
