import { test, expect } from "@playwright/test";
import { checkAccessibility } from "./fixtures/accessibility";

test("wide navigation keeps selected trim still and respects reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 2560, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/producers");
  const header = await page.locator(".site-header").boundingBox();
  expect(header?.x).toBe(0);
  expect(header?.width).toBe(2560);
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  const selected = nav.getByRole("link", { name: "Producers", exact: true });
  await selected.hover();
  expect(
    await selected.evaluate((e) => getComputedStyle(e, "::after").opacity),
  ).toBe("0");
  const other = nav.getByRole("link", { name: "My Library", exact: true });
  await other.hover();
  expect(
    await other.evaluate((e) => getComputedStyle(e, "::after").animationName),
  ).toBe("nav-trim-orbit");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await other.evaluate((e) => getComputedStyle(e, "::after").animationName),
  ).toBe("none");
  await expect(page.locator(".site-shell > canvas")).toBeHidden();
});

for (const width of [1440, 375]) {
  test(`pack opens above its desktop and closes cleanly at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByRole("button", { name: "VOTE TO HACK" }).click();
    const open = page.getByRole("button", { name: /OPEN ARCHIVE/ });
    await open.click();
    const window = page.getByRole("dialog");
    await expect(window).toBeVisible();
    await expect(page.locator(".hack-target")).toBeAttached();
    await expect(window.locator(".archive-pack-row")).toHaveCount(1);
    await checkAccessibility(page);
    expect(
      await window.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: `.tools/modern-pack-${width}.png` });
    await window
      .getByRole("button", { name: "Close artist archive", exact: true })
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

test("navigation keeps cobalt selection colors on desktop and mobile", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/producers");
  const desktop = page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Producers", exact: true });
  await expect(desktop).toHaveCSS("background-color", "rgb(16, 40, 75)");
  await desktop.hover();
  await expect(desktop).toHaveCSS("background-color", "rgb(16, 40, 75)");
  await page.setViewportSize({ width: 375, height: 850 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  const mobile = page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Producers", exact: true });
  await expect(mobile).toHaveCSS("background-color", "rgb(16, 40, 75)");
});
