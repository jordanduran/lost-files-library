import { test, expect } from "@playwright/test";
import { checkAccessibility } from "./fixtures/accessibility";

for (const width of [1440, 375]) {
  test(`pack opens above its desktop and closes cleanly at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByRole("button", { name: "VOTE TO HACK" }).click();
    const open = page.getByRole("button", { name: /OPEN ALLEN'S FILES/ });
    await open.click();
    const window = page.getByRole("dialog");
    await expect(window).toBeVisible();
    await expect(page.locator(".hack-target")).toBeAttached();
    await expect(window.locator(".archive-file")).toHaveCount(17);
    await checkAccessibility(page);
    expect(
      await window.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: `.tools/modern-pack-${width}.png` });
    await window
      .getByRole("button", { name: "Close pack", exact: true })
      .click();
    await expect(window).toHaveCount(0);
    await expect(open).toBeFocused();
    await page.screenshot({
      path: `.tools/modern-home-${width}.png`,
      fullPage: true,
    });
    await open.click();
    await page.keyboard.press("Escape");
    await expect(window).toHaveCount(0);
    await expect(open).toBeFocused();
  });
}
