import { test, expect } from "@playwright/test";

test("player stays hidden until preview, closes, and reopens from the start", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto("/beats");
  const player = page.getByRole("complementary", {
    name: "Global preview player",
  });
  await expect(player).toHaveCount(0);
  await expect(page.locator(".site-shell")).toHaveCSS("padding-bottom", "0px");
  await page
    .getByRole("button", { name: "Preview Midnight Drive (visual demo)" })
    .click();
  await expect(player).toBeVisible();
  await player
    .getByRole("slider", { name: "Preview position (visual demo)" })
    .fill("50");
  await player.getByRole("button", { name: "Close preview player" }).click();
  await expect(player).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Preview Midnight Drive (visual demo)" }),
  ).toHaveAttribute("aria-pressed", "false");
  await page
    .getByRole("button", { name: "Preview Midnight Drive (visual demo)" })
    .click();
  await expect(
    player.getByRole("slider", { name: "Preview position (visual demo)" }),
  ).toHaveValue(/^0(?:\.\d+)?$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    375,
  );
});

test("preview pauses and dismisses automatically when the duration ends", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/beats");
  await page
    .getByRole("button", { name: "Preview Midnight Drive (visual demo)" })
    .click();
  const player = page.getByRole("complementary", {
    name: "Global preview player",
  });
  await page.clock.fastForward(1000);
  await player.getByRole("button", { name: "Pause visual preview" }).click();
  const position = await player
    .getByRole("slider", { name: "Preview position (visual demo)" })
    .inputValue();
  await page.clock.fastForward(200000);
  await expect(player).toBeVisible();
  await expect(
    player.getByRole("slider", { name: "Preview position (visual demo)" }),
  ).toHaveValue(position);
  await player.getByRole("button", { name: "Start visual preview" }).click();
  await page.clock.fastForward(162000);
  await expect(player).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Preview Midnight Drive (visual demo)" }),
  ).toBeVisible();
});
