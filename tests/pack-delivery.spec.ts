import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createHmac } from "node:crypto";
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
  await page.getByRole("button", { name: "Continue to test checkout" }).click();
  await expect(
    page.getByRole("heading", { name: "Checking your payment." }),
  ).toBeVisible();
  const payload = JSON.stringify({
    id: "evt_pack",
    object: "event",
    type: "checkout.session.completed",
    livemode: false,
    data: {
      object: {
        id: "cs_test_guest",
        payment_status: "paid",
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
  const base = `/api/delivery/${token}/30000000-0000-0000-0000-000000000001`;
  const license = await page.request.post(`${base}/license`);
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
  await otherPage.getByRole("button", { name: "Email me a code" }).click();
  await expect(otherPage.getByRole("status")).toContainText("Code sent");
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
  await expect(accountPage.locator(".dashboard-table")).toContainText(
    "Night Shift Drums",
  );
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
