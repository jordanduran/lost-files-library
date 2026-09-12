import { test, expect } from "@playwright/test";

test("real preview plays, seeks, changes volume, pauses, and survives navigation", async ({
  page,
}) => {
  await page.goto("/beats");
  const player = page.getByRole("complementary", {
    name: "Global preview player",
  });
  const audio = page.locator("audio");
  await expect(player).toHaveCount(0);
  await page
    .getByRole("button", { name: "Preview Midnight Drive (demo audio)" })
    .click();
  await expect
    .poll(() =>
      audio.evaluate((element: HTMLAudioElement) => element.currentTime),
    )
    .toBeGreaterThan(0);
  expect(
    await audio.evaluate((element: HTMLAudioElement) => element.duration),
  ).toBe(16);
  await player
    .getByRole("slider", { name: "Preview position", exact: true })
    .fill("50");
  await expect
    .poll(() =>
      audio.evaluate((element: HTMLAudioElement) => element.currentTime),
    )
    .toBeGreaterThanOrEqual(8);
  await player
    .getByRole("slider", { name: "Preview volume", exact: true })
    .fill("25");
  await expect
    .poll(() => audio.evaluate((element: HTMLAudioElement) => element.volume))
    .toBe(0.25);
  await player.getByRole("button", { name: "Mute", exact: true }).click();
  await expect
    .poll(() => audio.evaluate((element: HTMLAudioElement) => element.volume))
    .toBe(0);
  await player.getByRole("button", { name: "Pause preview" }).click();
  await expect
    .poll(() => audio.evaluate((element: HTMLAudioElement) => element.paused))
    .toBe(true);
  const position = await audio.evaluate(
    (element: HTMLAudioElement) => element.currentTime,
  );
  await player.getByRole("link", { name: "Midnight Drive" }).click();
  expect(
    await audio.evaluate((element: HTMLAudioElement) => element.currentTime),
  ).toBe(position);
  await player.getByRole("button", { name: "Start preview" }).click();
  await expect
    .poll(() => audio.evaluate((element: HTMLAudioElement) => element.paused))
    .toBe(false);
  await player.getByRole("button", { name: "Next track" }).click();
  await expect(audio).toHaveAttribute("src", "/audio/demo/beat-2.wav");
  await expect
    .poll(() =>
      audio.evaluate((element: HTMLAudioElement) => element.currentTime),
    )
    .toBeGreaterThan(0);
});

test("player closes, reopens from the start, and dismisses when real audio ends", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto("/beats");
  const player = page.getByRole("complementary", {
    name: "Global preview player",
  });
  const audio = page.locator("audio");
  await page
    .getByRole("button", { name: "Preview Midnight Drive (demo audio)" })
    .click();
  await expect
    .poll(() =>
      audio.evaluate((element: HTMLAudioElement) => element.readyState),
    )
    .toBeGreaterThanOrEqual(2);
  await player
    .getByRole("slider", { name: "Preview position", exact: true })
    .fill("50");
  await player.getByRole("button", { name: "Close preview player" }).click();
  await expect(player).toHaveCount(0);
  await expect(page.locator(".site-shell")).toHaveCSS("padding-bottom", "0px");
  await page
    .getByRole("button", { name: "Preview Midnight Drive (demo audio)" })
    .click();
  await expect
    .poll(() =>
      audio.evaluate((element: HTMLAudioElement) => element.currentTime),
    )
    .toBeLessThan(2);
  await expect
    .poll(() => audio.evaluate((element: HTMLAudioElement) => element.paused))
    .toBe(false);
  await audio.evaluate((element: HTMLAudioElement) => {
    element.currentTime = element.duration - 0.2;
  });
  await expect(player).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    375,
  );
});

test("missing audio shows an error and another track can still play", async ({
  page,
}) => {
  await page.route("**/audio/demo/beat-1.wav", (route) => route.abort());
  await page.goto("/beats");
  await page
    .getByRole("button", { name: "Preview Midnight Drive (demo audio)" })
    .click();
  const player = page.getByRole("complementary", {
    name: "Global preview player",
  });
  await expect(player.getByRole("alert")).toBeVisible();
  await player.getByRole("button", { name: "Next track" }).click();
  await player.getByRole("button", { name: "Start preview" }).click();
  await expect
    .poll(() =>
      page
        .locator("audio")
        .evaluate((element: HTMLAudioElement) => element.currentTime),
    )
    .toBeGreaterThan(0);
  await expect(player.getByRole("alert")).toHaveCount(0);
});
