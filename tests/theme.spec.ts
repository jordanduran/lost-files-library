import { test, expect } from "@playwright/test";
for (const width of [390, 1440])
  test("file system theme across pages " + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const path of [
      "/",
      "/beats",
      "/packs",
      "/cart",
      "/login",
      "/producers",
      "/discover",
    ]) {
      await page.goto(path);
      await expect(page.locator(".file-system-theme")).toBeVisible();
      if (path === "/beats")
        await expect(page).toHaveURL(/\/producers\/allen-ritter$/);
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBe(width);
      await page.screenshot({
        path:
          "test-results/theme-" +
          width +
          "-" +
          (path.slice(1) || "home") +
          ".png",
        fullPage: true,
      });
    }
    expect(errors).toEqual([]);
  });
