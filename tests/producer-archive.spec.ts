import { test, expect } from "@playwright/test";

test("one vote unlocks Allen Ritter's pack archive and persists", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Allen Ritter" })).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Beats" }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "VOTE TO HACK" }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  await expect(page.getByRole("button", { name: /OPEN ALLEN'S FILES/ })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: /OPEN ALLEN'S FILES/ })).toBeVisible();
  await page.getByRole("button", { name: /OPEN ALLEN'S FILES/ }).click();

  await expect(page.getByText("HACK COMPLETE", { exact: true })).toBeVisible();
  await expect(page.locator(".archive-file")).toHaveCount(6);
  await page.getByRole("button", { name: /VELVET_SKYLINE\.WAV/ }).click();
  await expect(page.locator(".archive-inspector h2")).toHaveText("Velvet Skyline");
  await page.getByRole("button", { name: "PREVIEW FILE" }).click();
  await expect(page.getByRole("complementary", { name: "Global preview player" })).toBeVisible();

  await page.getByRole("button", { name: /PURCHASE PACK/ }).click();
  await expect(page.getByRole("dialog")).toContainText("Beats are not sold separately");
});

test("producer routes replace the global beat catalog and fit mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 850 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/beats");
  await expect(page).toHaveURL(/\/producers\/allen-ritter$/);
  await expect(page.getByRole("heading", { name: "Allen Ritter" })).toBeVisible();

  await page.getByRole("button", { name: "VOTE TO HACK" }).click();
  await page.getByRole("button", { name: /OPEN ALLEN'S FILES/ }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);

  await page.goto("/producers");
  await expect(page.getByRole("heading", { name: "Producer archives." })).toBeVisible();
  await expect(page.getByRole("link", { name: /HACK TARGET 001 ALLEN RITTER/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});
