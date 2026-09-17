import { test, expect } from "@playwright/test";
test("midnight palette and motherboard reveal work across public pages", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const route of [
    "/",
    "/cart",
    "/producers",
    "/discover",
    "/packs",
    "/login",
    "/recover",
    "/not-a-real-page",
  ]) {
    await page.goto(route);
    const shell = page.locator(".site-shell");
    await expect(page.locator("body")).toHaveCSS("--accent", "#247dff");
    await expect(shell).toHaveCSS("--window-accent", "#247dff");
    await expect(shell).toHaveCSS("background-image", /radial-gradient/);
    await page.mouse.move(20, 200);
    const canvas = page.locator(".site-shell > canvas");
    await expect(canvas).toHaveCSS("display", "block");
    await expect(canvas).toHaveCSS("opacity", "1");
    await expect(canvas).toHaveCSS("pointer-events", "none");
    if (route === "/discover") {
      const card = page.locator('.city-vote[aria-pressed="false"]').first();
      await card.hover();
      await expect
        .poll(() =>
          card.evaluate((el) => getComputedStyle(el, "::after").animationName),
        )
        .toBe("none");
      await expect(card).toHaveCSS("border-top-color", "rgb(36, 125, 255)");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect
        .poll(() =>
          card.evaluate((el) => getComputedStyle(el, "::after").animationName),
        )
        .toBe("none");
      await page.emulateMedia({ reducedMotion: "no-preference" });
    }
    if (route === "/") {
      await expect(page.locator(".midnight-home")).toHaveCSS(
        "background-color",
        "rgba(0, 0, 0, 0)",
      );
      await expect(page.locator(".midnight-home")).toHaveCSS(
        "background-image",
        "none",
      );
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".site-shell > canvas")).toHaveCSS(
    "display",
    "none",
  );
});
