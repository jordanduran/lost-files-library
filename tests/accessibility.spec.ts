import { test, expect } from "@playwright/test";
import { createRequire } from "node:module";
import type { AxeResults } from "axe-core";
import { checkAccessibility } from "./fixtures/accessibility";

const require = createRequire(`${process.cwd()}/package.json`);
test("keyboard users can skip the intro without hidden focus", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(".matrix-intro")).toHaveCount(0);
  await expect(page.locator(".home-landing")).not.toHaveAttribute("inert");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
});
test("pack dialog traps focus, closes with Escape, and passes accessibility checks", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const trigger = page
    .getByRole("button", { name: "OPEN PACK", exact: true })
    .first();
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await checkAccessibility(page);
  for (let index = 0; index < 15; index++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("purchase recovery offers retry after a network failure", async ({
  page,
}) => {
  await page.goto("/recover");
  await page.getByLabel("Checkout email").fill("buyer@example.test");
  await page.route("**/recover", (route) =>
    route.request().method() === "POST" ? route.abort() : route.continue(),
  );
  await page.getByRole("button", { name: "Email my download links" }).click();
  await expect(page.locator("#recovery-feedback")).toHaveText(
    "Could not connect. Please try again.",
  );
  await expect(
    page.getByRole("button", { name: "Email my download links" }),
  ).toBeEnabled();
});
for (const width of [375, 1440]) {
  test(`V1 public pages have no automated WCAG violations at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const path of [
      "/",
      "/producers",
      "/producers/allen-ritter",
      "/cart",
      "/login",
      "/library",
      "/recover",
      "/downloads/invalid",
    ]) {
      await page.goto(path);
      if (path === "/")
        await expect(page.locator(".home-landing")).toHaveAttribute(
          "data-ready",
          "true",
        );
      await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
      const violations = await page.evaluate(async () => {
        const axe = (
          window as unknown as {
            axe: { run: (options: object) => Promise<AxeResults> };
          }
        ).axe;
        const result = await axe.run({
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
          },
        });
        return result.violations.map(({ id, nodes }) => ({
          id,
          targets: nodes.map((node) => node.target),
        }));
      });
      expect.soft(violations, path).toEqual([]);
    }
  });
}

test("keyboard skip link and mobile navigation preserve focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/library");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  const toggle = page.getByRole("button", { name: "Open navigation" });
  await toggle.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(
    page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "Producers", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});
