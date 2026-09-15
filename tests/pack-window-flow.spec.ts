import { test, expect } from "@playwright/test";

for (const width of [1440, 375]) {
  test(`pack browsing to cart and back stays coherent at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const open = page
      .getByRole("button", { name: "OPEN PACK", exact: true })
      .first();
    await open.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Close pack", exact: true }).click();
    await expect(open).toBeFocused();
    await open.click();
    await page.getByRole("button", { name: /ADD COMPLETE PACK/ }).click();
    await expect(
      page.getByRole("link", { name: "IN CART / VIEW CART" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /ADD COMPLETE PACK/ }),
    ).toHaveCount(0);
    await page.locator(".cart-toast a").click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator(".pack-cart-item")).toHaveCount(1);
    await page.reload();
    await expect(page.locator(".pack-cart-item")).toHaveCount(1);
    await page.getByRole("link", { name: /Continue exploring/ }).click();
    await expect(page).toHaveURL(/#store-packs-title$/);
    await open.click();
    await expect(
      page.getByRole("link", { name: "IN CART / VIEW CART" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "IN CART / VIEW CART" }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await page.getByRole("button", { name: /Remove Night Shift/ }).click();
    await expect(
      page.getByRole("heading", { name: "No packs queued." }),
    ).toBeVisible();
    await page.getByRole("link", { name: /Browse available packs/ }).click();
    await open.click();
    await expect(
      page.getByRole("button", { name: /ADD COMPLETE PACK/ }),
    ).toBeVisible();
  });
}
