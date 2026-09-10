import { test, expect } from "@playwright/test";

test("catalog filters, player navigation, and package cart flow", async ({
  page,
}) => {
  await page.goto("/beats");
  await expect(
    page.getByRole("heading", { name: "Find your sound." }),
  ).toBeVisible();
  await page.getByRole("searchbox").fill("Velvet");
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Preview Velvet Skyline (visual demo)" })
    .click();
  const player = page.getByRole("complementary", {
    name: "Global preview player",
  });
  await expect(
    player.getByRole("link", { name: "Velvet Skyline" }),
  ).toBeVisible();
  await page
    .getByRole("table")
    .getByRole("link", { name: "Velvet Skyline" })
    .click();
  await expect(
    player.getByRole("button", { name: "Pause visual preview" }),
  ).toBeVisible();
  await page.getByRole("radio", { name: /WAV \+ Stems/ }).check();
  await page.getByRole("button", { name: /Add to Cart/ }).click();
  await expect(
    page.getByRole("button", { name: /Added to Cart/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Added to Cart/ }).click();
  await page.getByRole("link", { name: "Cart, 3 items" }).click();
  await expect(page.getByText("$177.00")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Remove Velvet Skyline, WAV + Stems" })
    .click();
  await expect(page.getByText("$78.00")).toHaveCount(2);
  await page.getByRole("button", { name: "Proceed to Checkout" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "no charge will be made",
  );
});

test("filters reset, sorting, empty cart and unavailable download behavior", async ({
  page,
}) => {
  await page.goto("/beats");
  await page
    .getByRole("combobox", { name: "Filter by genre" })
    .selectOption("R&B");
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(3);
  await page
    .getByRole("combobox", { name: "Filter by bpm" })
    .selectOption("140+");
  await expect(
    page.getByRole("heading", { name: "No sounds found." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reset filters", exact: true })
    .click();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(9);
  await page
    .getByRole("combobox", { name: "Sort beats" })
    .selectOption("popular");
  await expect(page.getByRole("table").getByRole("row").nth(1)).toContainText(
    "Midnight Drive",
  );
  await page.goto("/cart");
  await page
    .getByRole("button", { name: "Remove Midnight Drive, MP3 License" })
    .click();
  await page
    .getByRole("button", { name: "Remove Velvet Skyline, WAV License" })
    .click();
  await expect(
    page.getByText("Your cart is empty.", { exact: false }),
  ).toBeVisible();
  await page.goto("/library");
  await page
    .getByRole("button", { name: "Download", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Downloads are not enabled yet",
  );
});

for (const width of [375, 768, 1440]) {
  test(`routes render without overflow or browser errors at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const route of [
      "/",
      "/beats",
      "/beats/midnight-drive",
      "/cart",
      "/library",
      "/admin",
    ]) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}

test("homepage CTA is legible and mobile navigation works", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 850 });
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Browse Beats", exact: true }),
  ).toHaveCSS("color", "rgb(17, 18, 17)");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Beats", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Find your sound." }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toHaveCount(0);
});
