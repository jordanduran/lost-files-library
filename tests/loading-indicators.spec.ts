import { test, expect } from "@playwright/test";
import { checkAccessibility } from "./fixtures/accessibility";

for (const width of [390, 1280]) {
  test(`loading previews stay accessible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.goto("/preview/loading");
    await expect(
      page.getByRole("status", { name: "Loading your purchases" }),
    ).toHaveAttribute("aria-busy", "true");
    await expect(page.locator(".loading-ring")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(page.locator(".loading-ring")).toHaveCSS(
      "animation-name",
      "loading-ring-turn",
    );
    await expect(page.locator(".loading-card")).toHaveCount(6);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".loading-ring")).toHaveCSS(
      "animation-name",
      "none",
    );
    await expect(page.locator(".loading-pulse").first()).toHaveCSS(
      "animation-name",
      "none",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await checkAccessibility(page);
  });
}
