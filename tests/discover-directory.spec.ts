import { test, expect } from "@playwright/test";
import { checkAccessibility } from "./fixtures/accessibility";
for (const width of [390, 800, 1440])
  test(`discover and directory navigation at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/producers");
    await checkAccessibility(page);
    await page.screenshot({
      path: `.tools/producers-${width}.png`,
      fullPage: true,
    });
    const nav = page.getByRole("navigation", {
      name: width < 761 ? "Mobile navigation" : "Main navigation",
    });
    if (width < 761)
      await page.getByRole("button", { name: "Open navigation" }).click();
    await nav.getByRole("link", { name: "Discover", exact: true }).click();
    await expect(page).toHaveURL(/\/discover$/);
    await checkAccessibility(page);
    await page.getByRole("button", { name: "Minimize globe" }).click();
    await expect(
      page.getByRole("button", { name: "Restore globe" }),
    ).toBeVisible();
    await page.locator(".city-vote").first().click();
    await expect(
      page.getByRole("link", { name: "Sign in to vote" }),
    ).toHaveAttribute("href", "/login?next=/discover");
    await page.getByRole("link", { name: /Browse producer archives/ }).click();
    await expect(page).toHaveURL(/\/producers$/);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
