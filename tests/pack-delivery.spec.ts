import { test, expect } from "@playwright/test";
import { readFile, writeFile, rm } from "node:fs/promises";
import { createHmac } from "node:crypto";
import { checkAccessibility } from "./fixtures/accessibility";
test("unavailable download links offer recovery without exposing purchase details", async ({
  page,
  request,
}) => {
  for (const token of ["invalid", "b".repeat(64)]) {
    await page.goto(`/downloads/${token}`);
    await expect(
      page.getByRole("heading", { name: "This download is unavailable." }),
    ).toBeVisible();
    await expect(
      page
        .locator(".delivery-window")
        .getByRole("link", { name: "Find my purchases" }),
    ).toHaveAttribute("href", "/recover");
    await expect(
      page
        .locator(".delivery-window")
        .getByRole("link", { name: "My Library" }),
    ).toHaveAttribute("href", "/library");
    await expect(page.locator(".delivery-window")).not.toContainText(
      "Night Shift Drums",
    );
  }
  const path = `/api/delivery/${"b".repeat(64)}/30000000-0000-0000-0000-000000000001/license`;
  const response = await request.get(path, {
    headers: { accept: "application/json" },
  });
  expect(response.status()).toBe(404);
  expect(response.headers()["cache-control"]).toBe("private, no-store");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(path);
  await expect(page).toHaveURL(/\/downloads\/unavailable$/);
  await expect(
    page.getByRole("heading", { name: "This download is unavailable." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".delivery-window")
    .getByRole("link", { name: "Find my purchases" })
    .click();
  await expect(page).toHaveURL(/\/recover$/);
});

test("guest checkout waits for verified payment and delivers scoped ZIP and license", async ({
  page,
  request,
  browser,
}) => {
  await page.goto("/cart");
  await page.evaluate(() =>
    localStorage.setItem(
      "lost-files-pack-cart-v1",
      JSON.stringify({
        state: { items: [{ packId: "store-pack-001" }] },
        version: 0,
      }),
    ),
  );
  await page.reload();
  await page.locator("summary").filter({ hasText: "Demo License" }).click();
  await expect(page.getByText("Demo One")).toBeVisible();
  await expect(page.locator(".cart-summary")).toContainText(
    "No account required.",
  );
  const deniedCheckout = await request.post("/api/packs/checkout", {
    headers: { origin: "https://unrelated.example" },
    data: ["store-pack-001"],
  });
  expect(deniedCheckout.status()).toBe(403);
  await page.route(
    "**/api/packs/checkout",
    (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Please retry checkout." }),
      }),
    { times: 1 },
  );
  await page.getByRole("button", { name: "Continue to test checkout" }).click();
  await expect(page.locator(".cart-summary").getByRole("alert")).toHaveText(
    "Please retry checkout.",
  );
  await expect(page.getByRole("heading", { name: "Your cart." })).toBeVisible();
  await page.evaluate(() => {
    sessionStorage.removeItem("checkout-not-found-flash");
    const observer = new MutationObserver(() => {
      if (
        /page not found|this page could not be found/i.test(
          document.body.innerText,
        )
      )
        sessionStorage.setItem("checkout-not-found-flash", "true");
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });
  await page.route(
    "**/checkout/success?**",
    async (route) => {
      // A slow destination must not replace the current cart with an error.
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.continue();
    },
    { times: 1 },
  );
  await page.getByRole("button", { name: "Continue to test checkout" }).click();
  await expect(
    page.getByRole("heading", { name: "Checking your payment." }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("checkout-not-found-flash"),
    ),
  ).toBeNull();
  const payload = JSON.stringify({
    id: "evt_pack",
    object: "event",
    type: "checkout.session.completed",
    livemode: false,
    data: {
      object: {
        id: "cs_test_guest",
        payment_status: "paid",
        livemode: false,
        payment_intent: "pi_guest",
        amount_total: 100,
        currency: "usd",
        metadata: {
          checkout_kind: "pack",
          order_id: "10000000-0000-0000-0000-000000000001",
        },
        customer_details: { email: "guest@example.test" },
      },
    },
  });
  const invalid = await request.post("/api/stripe/webhook", {
    data: payload,
    headers: { "stripe-signature": "invalid" },
  });
  expect(invalid.status()).toBe(400);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", "whsec_fixture")
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  for (let i = 0; i < 2; i++)
    expect(
      (
        await request.post("/api/stripe/webhook", {
          data: payload,
          headers: { "stripe-signature": `t=${timestamp},v1=${signature}` },
        })
      ).status(),
    ).toBe(200);
  await page.reload();
  await expect(page).toHaveURL(/\/downloads\/[a-f0-9]{64}$/);
  await expect(
    page.getByRole("heading", { name: "Your pack is ready." }),
  ).toBeVisible();
  const token = page.url().split("/").pop();
  await writeFile(".tools/mock-download-failure", "true");
  try {
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "We couldn’t load this page." }),
    ).toBeVisible();
    await expect(page.locator("main")).not.toContainText(
      "Fixture storage failure",
    );
    await checkAccessibility(page);
  } finally {
    await rm(".tools/mock-download-failure", { force: true });
  }
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your pack is ready." }),
  ).toBeVisible();
  const base = `/api/delivery/${token}/30000000-0000-0000-0000-000000000001`;
  await page.route(
    `**${base}/40000000-0000-0000-0000-000000000001`,
    (route) => route.fulfill({ status: 503, body: "Unavailable" }),
    { times: 1 },
  );
  await page.getByRole("button", { name: "↓ Download ZIP" }).click();
  await expect(
    page.locator(".delivery-download").getByRole("alert"),
  ).toContainText("Please try again");
  await page.route(
    "**/storage/v1/object/sign/lost-files-demo/private/demo.zip?**",
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/zip",
        headers: {
          "content-disposition": 'attachment; filename="test-pack.zip"',
        },
        body: Buffer.from(
          "504b0506000000000000000000000000000000000000",
          "hex",
        ),
      }),
  );
  const zipDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "↓ Download ZIP" }).click();
  const savedZip = await zipDownload;
  expect(savedZip.suggestedFilename()).toBe("test-pack.zip");
  expect(await savedZip.failure()).toBeNull();
  await expect(
    page.getByRole("heading", { name: "Your pack is ready." }),
  ).toBeVisible();
  await expect(
    page.locator(".delivery-download").getByRole("status"),
  ).toContainText("Download requested");
  const license = await page.request.post(`${base}/license`);
  await checkAccessibility(page);
  expect(license.status()).toBe(200);
  expect(await license.text()).toContain("Synthetic demo terms");
  expect(license.headers()["content-disposition"]).toContain("attachment");
  const zip = await page.request.post(
    `${base}/40000000-0000-0000-0000-000000000001`,
    { maxRedirects: 0 },
  );
  expect(zip.status()).toBe(303);
  expect(zip.headers().location).toContain("token=test-only");
  expect(zip.headers()["referrer-policy"]).toBe("no-referrer");
  expect(
    (
      await page.request.post(`${base}/40000000-0000-0000-0000-000000000002`)
    ).status(),
  ).toBe(404);
  expect(
    (
      await request.post(
        `/api/delivery/${"b".repeat(64)}/30000000-0000-0000-0000-000000000001/license`,
      )
    ).status(),
  ).toBe(404);
  const outsider = await browser.newContext();
  const blocked = await outsider.request.get(`${base}/license`, {
    maxRedirects: 0,
  });
  expect(blocked.status()).toBe(303);
  expect(blocked.headers().location).toContain("?item=");
  const otherPage = await outsider.newPage();
  await otherPage.goto(blocked.headers().location);
  await expect(
    otherPage.getByRole("heading", { name: "Verify your email." }),
  ).toBeVisible();
  await expect(otherPage.getByText("Synthetic demo terms")).toHaveCount(0);
  await otherPage.route(
    "**/downloads/**",
    (route) =>
      route.request().method() === "POST" ? route.abort() : route.continue(),
    { times: 1 },
  );
  await otherPage.getByRole("button", { name: "Email me a code" }).click();
  await expect(
    otherPage.locator(".delivery-verification [role=alert]"),
  ).toHaveText("Could not connect. Please try again.");
  await otherPage.getByRole("button", { name: "Email me a code" }).click();
  await expect(otherPage.getByRole("status")).toContainText("Code sent");
  await checkAccessibility(otherPage);
  const code = await readFile(".tools/mock-download-code.txt", "utf8");
  await otherPage
    .getByLabel("Email code")
    .fill(code === "000000" ? "000001" : "000000");
  await otherPage.getByRole("button", { name: "Verify & download" }).click();
  await expect(
    otherPage.locator(".delivery-verification [role=alert]"),
  ).toContainText("invalid or expired");
  await otherPage.getByLabel("Email code").fill(code);
  const downloaded = otherPage.waitForEvent("download");
  await otherPage.getByRole("button", { name: "Verify & download" }).click();
  expect((await downloaded).suggestedFilename()).toBe("Lost-Files-License.txt");
  const direct = await outsider.request.get(`${base}/zip`, { maxRedirects: 0 });
  expect(direct.status()).toBe(303);
  expect(direct.headers().location).toContain("token=test-only");
  await outsider.close();
  await page.screenshot({
    path: ".tools/downloads-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 850 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".tools/downloads-mobile.png",
    fullPage: true,
  });
  const accountBrowser = await browser.newContext();
  const accountPage = await accountBrowser.newPage();
  await accountPage.goto(`/login?next=/downloads/${token}`);
  await accountPage.route("**/auth/v1/authorize?**", async (route) => {
    const authorization = new URL(route.request().url());
    const callback = new URL(authorization.searchParams.get("redirect_to")!);
    callback.searchParams.set(
      "code",
      `test-code-${authorization.searchParams.get("code_challenge")}`,
    );
    await route.fulfill({ status: 302, headers: { location: callback.href } });
  });
  await accountPage
    .getByRole("button", { name: "Continue with Google" })
    .click();
  await expect(
    accountPage.getByRole("button", { name: "Save to My Library" }),
  ).toBeVisible();
  await accountPage.getByRole("button", { name: "Save to My Library" }).click();
  await expect(accountPage).toHaveURL(/\/library$/);
  await expect(accountPage.locator(".library-grid")).toContainText(
    "Night Shift Drums",
  );
  await expect(
    accountPage.getByRole("searchbox", { name: "Search your purchases" }),
  ).toHaveCSS("border-top-width", "0px");
  await expect(accountPage.locator(".library-sidebar")).toHaveCount(0);
  await accountPage
    .getByRole("searchbox", { name: "Search your purchases" })
    .fill("not in my library");
  await expect(
    accountPage.getByRole("heading", { name: "No matching purchases." }),
  ).toBeVisible();
  await accountPage.getByRole("button", { name: "Clear search" }).click();
  await accountPage
    .getByRole("button", { name: "List view", exact: true })
    .click();
  await expect(accountPage.locator(".library-grid")).toHaveAttribute(
    "data-view",
    "list",
  );
  await accountPage
    .getByRole("button", { name: "Grid view", exact: true })
    .click();
  await accountPage.getByLabel("Sort purchases").selectOption("name");
  await accountPage.screenshot({
    path: ".tools/library-spaced-desktop.png",
    fullPage: true,
  });
  await accountPage.setViewportSize({ width: 375, height: 850 });
  await accountPage.screenshot({
    path: ".tools/library-spaced-mobile.png",
    fullPage: true,
  });
  expect(
    await accountPage.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await accountPage.request.get(`${base}/license`)).status()).toBe(200);
  await accountBrowser.close();
});
