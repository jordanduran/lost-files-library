import { test, expect } from "@playwright/test";

test("one vote unlocks Allen Ritter's pack archive and persists", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Allen Ritter" })).toBeVisible();
  await expect(page.locator(".producer-pack-cover")).toBeVisible();
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
  await expect(page.locator(".archive-file")).toHaveCount(17);
  await page.screenshot({path:".tools/ritter-archive-desktop.png",fullPage:true});
  await page.getByRole("button", { name: /PHANTOM\.WAV/ }).click();
  await expect(page.locator(".archive-inspector h2")).toHaveText("Phantom");
  await page.getByRole("button", { name: "PREVIEW FILE" }).click();
  await expect(page.getByRole("complementary", { name: "Global preview player" })).toBeVisible();
  await expect(page.locator("audio")).toHaveAttribute("src", "/audio/ritter-files-vol-1/phantom.mp3");
  await expect.poll(() => page.locator("audio").evaluate(audio => (audio as HTMLAudioElement).currentTime)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Next track" }).click();
  await expect(page.locator("audio")).toHaveAttribute("src", "/audio/ritter-files-vol-1/shame-on-me-new.mp3");

  await page.getByRole("button", { name: /ADD COMPLETE PACK/ }).click();
  await expect(page.locator(".cart-toast[role=status]")).toContainText("The Ritter Files Vol. 1");
  await page.getByRole("link", { name: "VIEW CART / CHECKOUT" }).click();
  await expect(page.getByRole("heading", { name: "Your cart." })).toBeVisible();
  await expect(page.getByRole("button", {name:"Continue to test checkout"})).toBeDisabled();
  await expect(page.getByText("Files and license are being prepared.", {exact:false})).toBeVisible();
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
  await page.screenshot({path:".tools/ritter-archive-mobile.png",fullPage:true});

  await page.goto("/producers");
  await expect(page.getByRole("heading", { name: "Independent sound. Worldwide." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Where do we hack next?" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});
