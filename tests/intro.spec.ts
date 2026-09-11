import { test, expect } from "@playwright/test";

test("intro decodes the title, settles into the hero, and does not replay", async ({
  page,
}) => {
  await page.goto("/");
  const hero = page.getByRole("region", { name: "Lost Files Library" });
  const title = page.getByRole("heading", {
    level: 1,
    name: "Lost Files Library",
  });
  await expect(hero).toHaveAttribute("data-intro", "scrambling");
  await expect(title).not.toHaveText("Lost FilesLibrary");
  await expect(hero).not.toHaveAttribute("data-intro", /.+/, { timeout: 6000 });
  await expect(title).toHaveText("Lost FilesLibrary");
  await expect(hero.locator("canvas").locator("..")).toHaveCSS("opacity", "1");
  await expect(title).toHaveCSS("transform", "none");
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Browse Beats", exact: true }),
  ).toBeVisible();
  await expect(hero).not.toHaveAttribute("data-intro", /.+/);
});

test("reduced motion bypasses the intro", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const hero = page.getByRole("region", { name: "Lost Files Library" });
  await expect(hero).not.toHaveAttribute("data-intro", /.+/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Lost FilesLibrary",
  );
  await expect(hero.locator("canvas").locator("..")).toHaveCSS("opacity", "1");
});
