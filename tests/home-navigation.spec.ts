import { test, expect } from "@playwright/test";

test("homepage intro runs once per tab and logo returns skip animation", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".home-landing")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(page.locator(".home-landing")).toHaveAttribute(
    "data-animate",
    "true",
  );
  await page.reload();
  await expect(page.locator(".home-landing")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(page.locator(".home-landing")).toHaveAttribute(
    "data-animate",
    "false",
  );
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Producers", exact: true })
    .click();
  await expect(page).toHaveURL(/\/producers$/);
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Lost Files Library home", exact: true })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".home-landing")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(page.locator(".matrix-intro")).toHaveCount(0);
});

test("logo skips intro when entering home from another page and closes mobile navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 850 });
  await page.goto("/producers");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Lost Files Library home", exact: true })
    .click();
  await expect(page.locator(".home-landing")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(page.locator(".home-landing")).toHaveAttribute(
    "data-animate",
    "false",
  );
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toHaveCount(0);
});
