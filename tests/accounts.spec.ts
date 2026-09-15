import { test, expect } from "@playwright/test";

test("OAuth starts with a code challenge and the app callback", async ({
  page,
}) => {
  await page.goto("/login");
  const button = page.getByRole("button", {
    name: /Continue with (Google|GitHub)/,
  });
  test.skip(
    await button.isDisabled(),
    "Requires configured Supabase URL and publishable key",
  );
  // Intercept before leaving the browser: no provider login or emails occur.
  await page.route("**/auth/v1/authorize?**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "OAuth request intercepted",
    }),
  );
  const requestPromise = page.waitForRequest(
    (request) => new URL(request.url()).pathname === "/auth/v1/authorize",
  );
  await button.click();
  const authorization = new URL((await requestPromise).url());
  expect(["google", "github"]).toContain(
    authorization.searchParams.get("provider"),
  );
  expect(authorization.searchParams.get("code_challenge")).toBeTruthy();
  expect(authorization.searchParams.get("code_challenge_method")).toBe("s256");
  expect(new URL(authorization.searchParams.get("redirect_to")!).pathname).toBe(
    "/auth/callback",
  );
  await expect(page.getByText("OAuth request intercepted")).toBeVisible();
});

test("sign in opens the account form and private routes do not show sample data", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("button", { name: /Continue with (Google|GitHub)/ }),
  ).toBeVisible();
  for (const path of ["/account", "/admin"]) {
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
  await page.goto("/login");
  const unavailable = page.getByText("Accounts are being set up.", {
    exact: false,
  });
  test.skip(
    !(await unavailable.isVisible()),
    "App has configured authentication",
  );
  await expect(
    page.getByText("Accounts are being set up.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Continue with (Google|GitHub)/ }),
  ).toBeDisabled();
});

test("canceled OAuth displays a retry message and cannot redirect to another site", async ({
  page,
  request,
}) => {
  const response = await request.get(
    "/auth/callback?error=access_denied&next=https://example.com",
    { maxRedirects: 0 },
  );
  if (response.status() === 503) {
    expect(await response.text()).toContain("Sign-in is not configured");
    return;
  }
  expect(response.status()).toBe(307);
  const destination = response.headers()["location"];
  expect(new URL(destination).pathname).toBe("/login");
  expect(new URL(destination).searchParams.get("error")).toBe("oauth");
  expect(new URL(destination).searchParams.get("reason")).toBe("access_denied");
  expect(destination).not.toContain("example.com");
  expect(response.headers()["cache-control"]).toContain("no-store");
  await page.goto("/login?error=oauth");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Sign-in was canceled",
  );
});

for (const width of [375, 1440])
  test(
    "library navigation offers guest recovery at " + width,
    async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/producers");
      if (width === 375)
        await page.getByRole("button", { name: "Open navigation" }).click();
      const nav = page.getByRole("navigation", {
        name: width === 375 ? "Mobile navigation" : "Main navigation",
      });
      await expect(
        nav.getByRole("link", { name: "My Library", exact: true }),
      ).toHaveCount(1);
      await nav.getByRole("link", { name: "My Library", exact: true }).click();
      await expect(page).toHaveURL(/\/library$/);
      await expect(
        page.getByRole("heading", { name: "My Library", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Sign in to My Library" }),
      ).toHaveAttribute("href", "/login?next=/library");
      await expect(
        page.getByRole("link", { name: "Find purchases by email" }),
      ).toHaveAttribute("href", "/recover");
      await expect(page.locator(".dashboard-table")).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (width === 375)
        await expect(
          page.getByRole("navigation", { name: "Mobile navigation" }),
        ).toHaveCount(0);
      else
        await expect(
          nav.getByRole("link", { name: "My Library", exact: true }),
        ).toHaveAttribute("aria-current", "page");
    },
  );
