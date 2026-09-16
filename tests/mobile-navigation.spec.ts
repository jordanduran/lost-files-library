import { test, expect } from "@playwright/test";

test("mobile navigation closes across breakpoints, outside clicks and navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 850 });
  await page.goto("/producers");
  const toggle = page.getByRole("button", { name: /navigation/ });
  const mobile = page.getByRole("navigation", { name: "Mobile navigation" });
  await toggle.click();
  await expect(mobile).toBeVisible();
  await mobile.getByRole("link", { name: "Producers", exact: true }).focus();
  await page.setViewportSize({ width: 1024, height: 850 });
  await expect(mobile).toHaveCount(0);
  await expect(
    page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Producers", exact: true }),
  ).toBeFocused();
  await page.setViewportSize({ width: 375, height: 850 });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await page.keyboard.press("Escape");
  await expect(mobile).toHaveCount(0);
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.locator("main").click({ position: { x: 10, y: 400 } });
  await expect(mobile).toHaveCount(0);
  await toggle.click();
  await page.getByRole("link", { name: /Cart, / }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(mobile).toHaveCount(0);
});
