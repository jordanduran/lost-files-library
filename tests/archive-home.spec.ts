import { test, expect } from "@playwright/test";
for (const width of [1280, 390]) {
  test(`homepage artist archive flow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "VOTE TO HACK", exact: true }).first(),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "VOTE TO HACK", exact: true })
      .first()
      .click();
    const open = page.getByRole("button", {
      name: "OPEN ARCHIVE",
      exact: true,
    });
    await expect(open).toBeVisible();
    await page.screenshot({
      path: `.tools/midnight-home-${width}.png`,
      fullPage: true,
    });
    await open.click();
    const profile = page.getByRole("dialog", {
      name: /Allen Ritter \/ Archive/i,
    });
    await expect(profile).toBeVisible();
    await expect(page.locator(".archive-stack")).toHaveCount(0);
    await profile
      .getByRole("button", { name: /Vote to hack The Ritter Files/i })
      .click();
    await expect(page.locator(".pack-explorer-dialog")).toHaveCount(0);
    await expect(profile.getByText("UNLOCKED", { exact: true })).toBeVisible();
    await page.screenshot({
      path: `.tools/producer-profile-${width}.png`,
      fullPage: true,
    });
    await profile.getByRole("button", { name: /The Ritter Files/ }).click();
    await expect(page.locator(".pack-explorer-dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".pack-explorer-dialog")).toHaveCount(0);
    await expect(profile).toBeVisible();
    await profile.getByRole("button", { name: "Close artist archive" }).click();
    await expect(profile).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
