import { test, expect } from "@playwright/test";

/**
 * Smoke + core commerce flow E2E tests.
 * Target the public storefront. Payment (Stripe/Pesapal) requires real keys
 * and a live checkout, so those steps are structured to be run manually or on
 * a CI environment with the corresponding credentials.
 */

test.describe("Storefront", () => {
  test("loads the store landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/TrueWorks|trueworks/i);
  });

  test("store page renders and lists products", async ({ page }) => {
    await page.goto("/store");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    // A product grid should eventually render after data loads.
    await page.waitForTimeout(1500);
    const cards = page.locator("a[href*='/store/']").count();
    expect(cards).toBeGreaterThanOrEqual(1);
  });

  test("product detail page loads from the store grid", async ({ page }) => {
    await page.goto("/store");
    await page.waitForTimeout(1500);
    const first = page.locator("a[href*='/store/']").first();
    if ((await first.count()) === 0) {
      test.skip(true, "No published products available in environment");
      return;
    }
    await first.click();
    await expect(page).toHaveURL(/\/store\//);
  });
});

test.describe("Commerce", () => {
  test("add to cart and view cart", async ({ page }) => {
    await page.goto("/store");
    await page.waitForTimeout(1500);
    const first = page.locator("a[href*='/store/']").first();
    if ((await first.count()) === 0) {
      test.skip(true, "No published products available in environment");
      return;
    }
    await first.click();
    await expect(page).toHaveURL(/\/store\//);

    // Add to cart button (multiple potential labels used across tiers).
    const addBtn = page.getByRole("button", { name: /add to cart|add cart|buy now/i }).first();
    await addBtn.click();

    // Cart icon / link should show on desktop header.
    const cartLink = page.locator("a[href*='/cart']").first();
    await cartLink.click();
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.getByText("Cart", { exact: false }).first()).toBeVisible();
  });

  test("order confirmation page renders", async ({ page }) => {
    await page.goto("/order-confirmation");
    await expect(page).toHaveURL(/\/order-confirmation/);
  });
});