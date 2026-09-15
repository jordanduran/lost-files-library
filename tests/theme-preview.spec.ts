import { test, expect } from "@playwright/test";
import { checkAccessibility } from "./fixtures/accessibility";

test("intro uses Windows 95 boot chrome and keeps its original copy", async ({
  page,
}) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto("/");
  const intro = page.locator(".intro-boot-window");
  await expect(intro).toBeVisible();
  await expect(intro).toContainText("INITIALIZING ARCHIVE...");
  await expect(intro).toContainText(
    "DECRYPTING PRODUCER FILES / ACCESS PENDING",
  );
  await page.screenshot({ path: ".tools/win95-intro.png" });
  await page.clock.resume();
  await checkAccessibility(page);
  await expect(page.locator(".home-landing")).toHaveAttribute(
    "data-ready",
    "true",
  );
});

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
