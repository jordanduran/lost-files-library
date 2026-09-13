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
    .getByRole("button", { name: "Preview Velvet Skyline (demo audio)" })
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
    player.getByRole("button", { name: "Pause preview" }),
  ).toBeVisible();
  await page.getByRole("radio", { name: /WAV \+ Stems/ }).check();
  await page.getByRole("button", { name: /Add to Cart/ }).click();
  await expect(
    page.getByRole("button", { name: /Added to Cart/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Added to Cart/ }).click();
  await page.getByRole("link", { name: "Cart, 1 items" }).click();
  await page.reload();
  await expect(page.getByText("$99.00")).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Sign in to checkout" })).toBeVisible();
  await page
    .getByRole("button", { name: "Remove Velvet Skyline, WAV + Stems" })
    .click();
  await expect(page.getByText("Your cart is empty.", { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Your cart is empty.", { exact: false })).toBeVisible();
});

test("filters reset, sorting, empty cart and protected library", async ({
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
  await expect(
    page.getByText("Your cart is empty.", { exact: false }),
  ).toBeVisible();
  await page.goto("/library");
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Welcome to the library." }),
  ).toBeVisible();
  await expect(page.getByText("Sample library", { exact: false })).toHaveCount(
    0,
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
      "/login",
      "/account",
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
