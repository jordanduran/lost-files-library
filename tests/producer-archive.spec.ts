import { test, expect } from "@playwright/test";
for (const width of [390, 1280])
  test(`directory to producer, pack and cart at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/producers");
    await expect(
      page.getByRole("heading", { name: "Producers.", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".directory-back-window")).toHaveCount(2);
    const firstProducer = page.locator(".producer-directory-card").first();
    await expect(firstProducer.locator(".directory-portrait")).toBeVisible();
    await expect(
      firstProducer.locator(".directory-row-name strong"),
    ).toBeVisible();
    await expect(firstProducer.locator(".directory-row-count")).toHaveText(
      /^\d+ packs?$/,
    );
    await expect(firstProducer.locator(".directory-row-open")).toHaveText(
      "Open archive",
    );
    if (width <= 600) {
      await expect(firstProducer.locator(".directory-row-open")).toBeHidden();
      expect(
        (await firstProducer.boundingBox())?.height ?? Infinity,
      ).toBeLessThan(82);
    }
    await page
      .getByRole("searchbox", { name: "Search producers" })
      .fill("no such artist");
    await expect(
      page.getByText("No producers match your search."),
    ).toBeVisible();
    await page
      .getByRole("searchbox", { name: "Search producers" })
      .fill("Allen");
    await page.getByRole("link", { name: /Allen Ritter.*pack/i }).click();
    await expect(page).toHaveURL(/\/producers\/allen-ritter$/);
    await expect(
      page.getByRole("heading", { name: "Allen Ritter archive", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: /Vote to hack The Ritter Files/i })
      .click();
    await expect(page.locator(".pack-explorer-dialog")).toHaveCount(0);
    await page.reload();
    await page.getByRole("button", { name: /Open The Ritter Files/i }).click();
    await expect(page.locator(".pack-explorer-file")).toHaveCount(17);
    await page.getByRole("button", { name: /PHANTOM.WAV/ }).click();
    await expect(page.locator("audio")).toHaveAttribute(
      "src",
      "/audio/ritter-files-vol-1/phantom.mp3",
    );
    await page.getByRole("button", { name: /ADD COMPLETE PACK/ }).click();
    await expect(page.locator(".cart-toast")).toContainText(
      "The Ritter Files Vol. 1",
    );
    await page.getByRole("button", { name: "Close pack", exact: true }).click();
    await page.getByRole("link", { name: /Cart, 1 packs/ }).click();
    await expect(
      page.getByRole("heading", { name: "Your cart." }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.goto("/discover");
    await expect(
      page.getByRole("heading", { name: "Independent sound. Worldwide." }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Where do we hack next?" }),
    ).toBeVisible();
    await page.goto("/packs");
    await expect(
      page.getByRole("heading", { name: "All Packs", level: 1, exact: true }),
    ).toBeVisible();
    await expect(page.locator(".store-pack-card")).toHaveCount(4);
    const ritterCard = page
      .locator(".store-pack-card")
      .filter({ hasText: "The Ritter Files Vol. 1" });
    await expect(
      ritterCard.getByRole("button", { name: "OPEN PACK", exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      ritterCard.getByRole("button", { name: "OPEN PACK", exact: true }),
    ).toBeVisible();
  });

test("catalog lock label updates after a pack vote and demo reset", async ({
  page,
}) => {
  await page.goto("/packs");
  const card = page
    .locator(".store-pack-card")
    .filter({ hasText: "The Ritter Files Vol. 1" });
  await card
    .getByRole("button", { name: "LOCKED / OPEN PACK", exact: true })
    .click();
  await page
    .locator(".pack-explorer-dialog")
    .getByRole("button", { name: "VOTE TO HACK", exact: true })
    .click();
  await page.getByRole("button", { name: "Close pack", exact: true }).click();
  await expect(
    card.getByRole("button", { name: "OPEN PACK", exact: true }),
  ).toBeVisible();
  await page.goto("/");
  await page.getByRole("button", { name: "Reset unlock demo" }).click();
  await page.goto("/packs");
  await expect(
    card.getByRole("button", { name: "LOCKED / OPEN PACK", exact: true }),
  ).toBeVisible();
});
