import { test, expect } from "@playwright/test";

test("Windows 95 theme keeps desktop and mobile pages within the viewport", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [name, path] of [
      ["home", "/"],
      ["producers", "/producers"],
      ["recovery", "/recover"],
      ["library", "/library"],
      ["downloads", "/downloads/invalid"],
    ]) {
      await page.goto(path);
      if (path === "/")
        await expect(page.locator(".home-landing")).toHaveAttribute(
          "data-ready",
          "true",
        );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `.tools/win95-${name}-${width}.png`,
        fullPage: true,
      });
    }
  }
});
