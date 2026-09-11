import { test, expect } from "@playwright/test";

test("homepage hero globe rotates without playback controls", async ({
  page,
}) => {
  await page.goto("/");
  const globe = page.getByRole("img", { name: /Blueprint earth/ });
  await globe.scrollIntoViewIfNeeded();
  const snapshot = () =>
    globe.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
  const initial = await snapshot();
  await expect.poll(snapshot).not.toBe(initial);
  await expect(
    page.getByRole("heading", { level: 1, name: "Lost Files Library." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /globe rotation/ }),
  ).toHaveCount(0);
});

test("mobile globe respects reduced motion and fits the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const globe = page.getByRole("img", { name: /Blueprint earth/ });
  await globe.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      globe.evaluate((element) => (element as HTMLCanvasElement).width),
    )
    .toBeGreaterThan(300);
  await expect(
    page.getByRole("button", { name: "Pause globe rotation" }),
  ).toHaveCount(0);
  const snapshot = () =>
    globe.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
  const initial = await snapshot();
  await page.waitForTimeout(250);
  expect(await snapshot()).toBe(initial);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
});
