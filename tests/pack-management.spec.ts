import { test, expect, type BrowserContext } from "@playwright/test";
import { loadEnvFile } from "node:process";
import { checkAccessibility } from "./fixtures/accessibility";
try {
  loadEnvFile(".env.local");
} catch {}
async function signIn(context: BrowserContext, admin = true) {
  const encode = (v: unknown) =>
    Buffer.from(JSON.stringify(v)).toString("base64url");
  const id = admin
    ? "00000000-0000-0000-0000-000000000001"
    : "00000000-0000-0000-0000-000000000002";
  const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600, aud: "authenticated", role: "authenticated" })}.fixture`;
  const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(
    ".",
  )[0];
  await context.addCookies([
    {
      name: `sb-${ref}-auth-token`,
      value:
        "base64-" +
        encode({
          access_token: token,
          refresh_token: "fixture",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          expires_in: 3600,
          token_type: "bearer",
          user: { id },
        }),
      url: "http://localhost:3600",
    },
  ]);
}
test("non-admins cannot open the editor", async ({ page, context }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Manage packs." }),
  ).toHaveCount(0);
  await signIn(context, false);
  await page.goto("/admin/packs/new");
  await expect(page.getByRole("button", { name: "Save pack" })).toHaveCount(0);
});
test("admin navigation is available on desktop and mobile only to admins", async ({
  page,
  context,
}) => {
  await signIn(context);
  await page.goto("/cart");
  await page.locator(".account-menu summary").click();
  await page
    .locator(".account-menu")
    .getByRole("link", { name: "Manage packs" })
    .click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.locator(".account-menu")).not.toHaveAttribute("open", "");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  const mobile = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(
    mobile.getByRole("link", { name: "Manage packs" }),
  ).toHaveAttribute("aria-current", "page");
  await mobile.getByRole("link", { name: "Manage packs" }).click();
  await expect(mobile).toHaveCount(0);
  await context.clearCookies();
  await signIn(context, false);
  await page.goto("/cart");
  await expect(
    page.getByRole("link", { name: "Manage packs", includeHidden: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("link", { name: "Manage packs", includeHidden: true }),
  ).toHaveCount(0);
});
test("admin can save a draft, validate publication, preview safely, and unpublish", async ({
  page,
  context,
}) => {
  page.on("dialog", (dialog) => dialog.accept());
  await signIn(context);
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Manage packs." }),
  ).toBeVisible();
  await page.screenshot({ path: ".tools/pack-admin-desktop.png" });
  await page.getByRole("link", { name: "Add pack", exact: true }).click();
  await page.getByLabel("Pack ID", { exact: true }).fill("new-fixture");
  await page.getByLabel("Pack title", { exact: true }).fill("New draft pack");
  await page.getByLabel("Producer", { exact: true }).fill("Test Artist");
  await page.getByRole("button", { name: "Save pack", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/packs\/new-fixture$/);
  await expect(page.getByLabel("Pack title", { exact: true })).toHaveValue(
    "New draft pack",
  );
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("published");
  await page.getByRole("button", { name: "Save pack", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "license",
  );
  await page.goto("/admin/packs/ritter-files-vol-1");
  await page.getByRole("button", { name: "Preview pack", exact: true }).click();
  await page.getByRole("button", { name: "VOTE TO HACK" }).click();
  await page.getByRole("button", { name: /OPEN ALLEN'S FILES/ }).click();
  await expect(
    page.getByRole("button", { name: /ADD COMPLETE PACK/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close pack", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("draft");
  await page.getByRole("button", { name: "Save pack", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Pack saved." }),
  ).toBeVisible();
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Allen Ritter", exact: true }),
  ).toHaveCount(0);
});
test("editor fits mobile and labels controls", async ({ page, context }) => {
  await signIn(context);
  await page.setViewportSize({ width: 375, height: 850 });
  await page.goto("/admin/packs/new");
  await checkAccessibility(page);
  await page.screenshot({
    path: ".tools/pack-admin-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("verified upload publishes the managed price and lock state to the storefront", async ({
  page,
  context,
}) => {
  await signIn(context);
  await page.goto("/admin/packs/store-pack-001");
  await page.route("**/storage/v1/object/upload/sign/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ Key: "lost-files-demo/uploads/test.zip" }),
      headers: {
        "access-control-allow-origin": "http://localhost:3600",
        "access-control-allow-headers": "*",
        "access-control-allow-methods": "PUT,OPTIONS",
      },
    }),
  );
  await page.getByLabel("Test ZIP", { exact: true }).setInputFiles({
    name: "test.zip",
    mimeType: "application/zip",
    buffer: Buffer.alloc(100),
  });
  await expect(
    page.getByRole("status").filter({ hasText: "Upload complete" }),
  ).toBeVisible();
  await page
    .getByLabel("Pack title", { exact: true })
    .fill("Published fixture pack");
  await page.getByLabel("Price (USD)", { exact: true }).fill("19.50");
  await page.getByRole("checkbox", { name: /Locked —/ }).check();
  await page.getByRole("checkbox", { name: /Feature on homepage/ }).check();
  const requestPromise = page.waitForRequest(
    (r) => r.method() === "POST" && Boolean(r.headers()["next-action"]),
  );
  await page.getByRole("button", { name: "Save pack", exact: true }).click();
  const request = await requestPromise;
  await expect(
    page.getByRole("status").filter({ hasText: "Pack saved." }),
  ).toBeVisible();
  await context.clearCookies();
  const denied = await page.request.post(request.url(), {
    data: request.postData()!,
    headers: {
      "next-action": request.headers()["next-action"],
      "content-type": request.headers()["content-type"],
      origin: "http://localhost:3600",
    },
  });
  expect(denied.headers()["x-action-redirect"]).toContain("/login");
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "VOTE TO HACK" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "VOTE TO HACK" }).click();
  await page.getByRole("button", { name: "OPEN ARCHIVE", exact: true }).click();
  const packRow = page
    .locator(".archive-pack-row")
    .filter({ hasText: "Published fixture pack" });
  await expect(packRow).toContainText("$19.5");
  await packRow
    .getByRole("button", {
      name: "Vote to hack Published fixture pack",
      exact: true,
    })
    .click();
  await packRow
    .getByRole("button", { name: "Open Published fixture pack", exact: true })
    .click();
  await page
    .locator(".pack-explorer-file")
    .filter({ hasText: "MIDNIGHT_DRIVE.WAV" })
    .click();
  await expect(page.locator(".global-player")).toContainText("Midnight Drive");
  await page.getByRole("button", { name: /ADD.*PACK/ }).click();
  await expect(page.locator(".cart-toast")).toContainText(
    "Published fixture pack",
  );
  await page.goto("/cart");
  await expect(page.locator(".cart-table-heading").locator("..")).toContainText(
    "Published fixture pack",
  );
  await expect(page.locator(".pack-cart-item")).toContainText("$19.5");
});
