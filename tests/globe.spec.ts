import { test, expect } from "@playwright/test";

test("homepage globe rotates and can be paused and resumed", async ({
  page,
}) => {
  await page.goto("/");
  const globe = page.getByRole("img", { name: /Blueprint earth/ });
  await globe.scrollIntoViewIfNeeded();
  const snapshot = () =>
    globe.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
  const initial = await snapshot();
  await expect.poll(snapshot).not.toBe(initial);
  await page.getByRole("button", { name: "Pause globe rotation" }).click();
  const paused = await snapshot();
  await page.waitForTimeout(250);
  expect(await snapshot()).toBe(paused);
  await page.getByRole("button", { name: "Resume globe rotation" }).click();
  await expect.poll(snapshot).not.toBe(paused);
});

test("mobile globe respects reduced motion and fits the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const globe = page.getByRole("img", { name: /Blueprint earth/ });
  await globe.scrollIntoViewIfNeeded();
  await expect(page.getByText("STILL VIEW / REDUCED MOTION")).toBeVisible();
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
