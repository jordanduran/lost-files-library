import { test, expect } from "@playwright/test";

test("sign in opens the account form and private routes do not show sample data", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel("Email address")).toBeVisible();
  for (const path of ["/library", "/account", "/admin"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "Welcome to the library." }),
    ).toBeVisible();
    await expect(page.getByText("Demo account", { exact: true })).toHaveCount(
      0,
    );
    await expect(page.getByText("Total Products", { exact: true })).toHaveCount(
      0,
    );
  }
});

test("unconfigured auth is honest and cannot create a fake session", async ({
  page,
}) => {
  test.skip(
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    "Only applies to an unconfigured development build",
  );
  await page.goto("/login");
  await expect(
    page.getByText("Accounts are being set up.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send sign-in code" }),
  ).toBeDisabled();
  await expect(page.getByLabel("Email address")).toBeDisabled();
});
