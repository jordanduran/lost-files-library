import { test, expect } from "@playwright/test";
import { checkAccessibility } from "./fixtures/accessibility";

test.describe("session round trip with a test auth service", () => {
  test.skip(
    process.env.AUTH_SESSION_TEST !== "true",
    "Run with playwright.auth.config.ts; never uses real Google accounts",
  );
  for (const width of [375, 1440]) {
    test(`sign in, refresh, account menu, and sign out at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/login");
      await page.route("**/auth/v1/authorize?**", async (route) => {
        const authorization = new URL(route.request().url());
        const callback = new URL(
          authorization.searchParams.get("redirect_to")!,
        );
        callback.searchParams.set(
          "code",
          `test-code-${authorization.searchParams.get("code_challenge")}`,
        );
        await route.fulfill({
          status: 302,
          headers: { location: callback.href },
        });
      });
      await page.getByRole("button", { name: "Continue with Google" }).click();
      await expect(page).toHaveURL(/\/library$/);
      await expect(
        page.locator(".dashboard-table").getByText("The Ritter Files Vol. 1"),
      ).toBeVisible();
      await checkAccessibility(page);
      await page.goto("/");
      await expect(
        page.getByRole("button", { name: "VOTE TO HACK" }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: /OPEN ALLEN'S FILES/ }),
      ).toBeVisible();
      await page.reload();
      await expect(
        page.getByRole("button", { name: /OPEN ALLEN'S FILES/ }),
      ).toBeVisible();
      await expect(page.locator(".hack-pack-file")).toContainText("PURCHASED");
      await page.getByRole("button", { name: /OPEN ALLEN'S FILES/ }).click();
      await expect(
        page
          .locator(".archive-inspector")
          .getByRole("link", { name: "OWNED / OPEN MY LIBRARY" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /ADD COMPLETE PACK/ }),
      ).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.goto("/producers/allen-ritter");
      await expect(page.locator(".hack-pack-file")).toContainText("PURCHASED");
      await page.getByRole("button", { name: /OPEN ALLEN'S FILES/ }).click();
      await expect(
        page.getByRole("button", { name: /ADD COMPLETE PACK/ }),
      ).toHaveCount(0);
      await page
        .locator(".archive-inspector")
        .getByRole("link", { name: "OWNED / OPEN MY LIBRARY" })
        .click();
      await expect(page).toHaveURL(/\/library$/);
      await page.reload();
      const account = page.getByText("Signed in", { exact: true });
      await expect(account).toHaveCount(0);
      const menu = page.locator("summary", {
        has: page.locator(".account-avatar"),
      });
      await expect(menu).toHaveAttribute(
        "aria-label",
        "Account: listener@example.test, signed in",
      );
      await menu.click();
      await expect(page.locator(".account-menu-panel")).toContainText(
        "listener@example.test",
      );
      await page
        .locator(".account-menu-panel")
        .getByRole("link", { name: "Account settings" })
        .click();
      await expect(page).toHaveURL(/\/account$/);
      await checkAccessibility(page);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await menu.click();
      await page
        .locator(".account-menu-panel")
        .getByRole("button", { name: "Sign out" })
        .click();
      await expect(page).toHaveURL(/\/login$/);
      await expect(menu).toHaveCount(0);
      await page.goto("/library");
      await expect(
        page.getByRole("link", { name: "Find purchases by email" }),
      ).toBeVisible();
      await expect(page.locator(".dashboard-table")).toHaveCount(0);
    });
  }
  test("private downloads require the paid owner and matching file", async ({
    page,
  }) => {
    const item = "30000000-0000-0000-0000-000000000001";
    const file = "40000000-0000-0000-0000-000000000001";
    const other = "30000000-0000-0000-0000-000000000002";
    expect(
      (await page.request.post(`/api/downloads/${item}/${file}`)).status(),
    ).toBe(401);
    await page.goto("/login");
    await page.route("**/auth/v1/authorize?**", async (route) => {
      const url = new URL(route.request().url());
      const callback = new URL(url.searchParams.get("redirect_to")!);
      callback.searchParams.set(
        "code",
        `test-code-${url.searchParams.get("code_challenge")}`,
      );
      await route.fulfill({
        status: 302,
        headers: { location: callback.href },
      });
    });
    await page.getByRole("button", { name: "Continue with Google" }).click();
    await expect(page).toHaveURL(/\/library$/);
    await page.goto(`/library/${item}`);
    await expect(
      page.getByRole("button", { name: "Download", exact: true }),
    ).toBeVisible();
    expect(
      (await page.request.post(`/api/downloads/${other}/${file}`)).status(),
    ).toBe(404);
    expect(
      (await page.request.post(`/api/downloads/${item}/${other}`)).status(),
    ).toBe(404);
    const result = await page.request.post(`/api/downloads/${item}/${file}`);
    expect(result.status()).toBe(200);
    expect(result.headers()["cache-control"]).toContain("no-store");
    expect((await result.json()).url).toContain("token=test-only");
  });
  test("missing login cookie produces a specific retry instruction", async ({
    page,
  }) => {
    await page.goto("/auth/callback?code=test-code-without-cookie");
    await expect(page).toHaveURL(/reason=pkce_code_verifier_not_found/);
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "login cookie is missing",
    );
  });
});
