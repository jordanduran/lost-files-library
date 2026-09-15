import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test("guest recovery sends privately and gives neutral responses to missing, throttled, and failed lookups", async ({
  page,
}) => {
  test.skip(
    !test.info().config.configFile?.endsWith("playwright.recovery.config.ts"),
    "Use isolated recovery fixture",
  );
  await page.setViewportSize({ width: 375, height: 850 });
  await page.goto("/recover");
  await expect(
    page.getByRole("link", { name: "Contact support" }),
  ).toHaveAttribute("href", "mailto:help@example.test");
  const submit = async (email: string) => {
    await page.getByLabel("Checkout email").fill(email);
    const responsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().endsWith("/recover"),
    );
    await page.getByRole("button", { name: "Email my download links" }).click();
    await responsePromise;
    await expect(
      page.getByRole("button", { name: "Email my download links" }),
    ).toBeEnabled();
    expect(await page.content()).not.toContain("a".repeat(64));
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "If that email has available purchases" }),
    ).toBeVisible();
    return page.locator(".account-form [role=status]").innerText();
  };
  const known = await submit("Buyer@example.test");
  const result = async () =>
    JSON.parse(await readFile(".tools/mock-recovery-result.json", "utf8"));
  await expect.poll(async () => (await result()).sent).toBe(1);
  expect((await result()).text).toContain("/downloads/" + "a".repeat(64));
  for (const email of [
    "missing@example.test",
    "buyer@example.test",
    "failure@example.test",
  ])
    expect(await submit(email)).toBe(known);
  expect((await result()).sent).toBe(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/login");
  await expect(
    page.getByRole("link", { name: "Find my purchases", exact: true }),
  ).toBeVisible();
});
