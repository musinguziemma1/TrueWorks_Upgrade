import { describe, expect, it } from "vitest";
import robots from "../src/app/robots";

describe("robots.txt policy", () => {
  it("allows public storefront pages to be indexed", () => {
    const config = robots();
    const wildcardRule = Array.isArray(config.rules)
      ? config.rules.find((rule) => rule.userAgent === "*")
      : config.rules;

    expect(wildcardRule).toBeDefined();

    const disallow = Array.isArray(wildcardRule?.disallow)
      ? wildcardRule.disallow
      : [];

    expect(disallow).not.toContain("/store");
    expect(disallow).not.toContain("/resources");
    expect(disallow).not.toContain("/about");
    expect(disallow).not.toContain("/contact");
    expect(disallow).not.toContain("/cart");
    expect(disallow).not.toContain("/checkout");
    expect(disallow).not.toContain("/order-confirmation");
    expect(disallow).not.toContain("/sign-in");
    expect(disallow).not.toContain("/sign-up");
  });
});
