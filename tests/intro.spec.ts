import { test, expect } from "@playwright/test";

test("intro decodes, settles, and replays after a full refresh", async ({
  page,
}) => {
  await page.goto("/preview/original");
  const hero = page.getByRole("region", { name: "Lost Files Library" });
  const title = page.getByRole("heading", {
    level: 1,
    name: "Lost Files Library",
  });
  await expect(hero).toHaveAttribute("data-intro", "scrambling");
  await expect(page.locator(".site-header")).toBeHidden();
  await expect(page.locator(".site-footer")).toBeHidden();
  await expect(page.locator(".featured-section")).toBeHidden();
  await expect(title).not.toHaveText("Lost FilesLibrary");
  await expect(hero).toHaveAttribute("data-intro", "settling");
  await expect(page.locator(".site-header")).toBeVisible();
  await expect(hero.locator("p").first()).toHaveCSS(
    "animation-delay",
    "0.18s",
  );
  await expect(page.locator(".featured-section")).toHaveCSS(
    "animation-delay",
    "0.18s",
  );
  await expect(hero).not.toHaveAttribute("data-intro", /.+/, { timeout: 6000 });
  await expect(title).toHaveText("Lost FilesLibrary");
  await expect(hero.locator("p").first()).toHaveCSS("opacity", "1");
  await expect(title).toHaveCSS("transform", "none");
  await expect(page.locator(".site-header")).toBeVisible();
  await expect(page.locator(".site-footer")).toBeVisible();
  await expect(page.locator(".featured-section")).toBeVisible();
  await page.reload();
  await expect(hero).toHaveAttribute("data-intro", "scrambling");
  await expect(hero).not.toHaveAttribute("data-intro", /.+/, { timeout: 6000 });

});

test("reduced motion bypasses the intro", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/preview/original");
  const hero = page.getByRole("region", { name: "Lost Files Library" });
  await expect(hero).not.toHaveAttribute("data-intro", /.+/);
  await expect(page.locator(".site-header")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Lost FilesLibrary",
  );
  await expect(hero.locator("p").first()).toHaveCSS("opacity", "1");
});

test("explicit replay shows the intro even with reduced motion enabled", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/preview/original?intro=1");
  const hero = page.getByRole("region", { name: "Lost Files Library" });
  await expect(hero).toHaveAttribute("data-intro", "scrambling");
  await expect(hero).not.toHaveAttribute("data-intro", /.+/, { timeout: 6000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Lost FilesLibrary",
  );
});
