import { test, expect } from "@playwright/test";
import { createHmac } from "node:crypto";

test("live mode uses live sessions and entitlements with mocked services only", async ({
  page,
  request,
}) => {
  test.skip(
    test.info().project.name !== "mock-live",
    "Run with playwright.payment-live.config.ts; mocked services only.",
  );
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
  await expect(page.locator(".cart-summary")).toContainText(
    "Secure payment through Stripe.",
  );
  await expect(page.locator(".cart-summary")).not.toContainText(
    "No real money",
  );
  await page
    .getByRole("button", { name: "Continue to checkout", exact: true })
    .click();
  await expect(page).toHaveURL(/session_id=cs_live_guest/);
  await expect(
    page.getByRole("heading", { name: "Checking your payment." }),
  ).toBeVisible();
  const timestamp = Math.floor(Date.now() / 1000);
  const send = async (live: boolean) => {
    const data = JSON.stringify({
      id: "evt_live_fixture",
      object: "event",
      type: "checkout.session.completed",
      livemode: live,
      data: {
        object: {
          id: "cs_live_guest",
          livemode: live,
          payment_intent: "pi_liveguest",
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
    const signature = createHmac("sha256", "whsec_fixture")
      .update(`${timestamp}.${data}`)
      .digest("hex");
    return request.post("/api/stripe/webhook", {
      data,
      headers: { "stripe-signature": `t=${timestamp},v1=${signature}` },
    });
  };
  expect((await send(false)).status()).toBe(400);
  expect((await send(true)).status()).toBe(200);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your pack is ready." }),
  ).toBeVisible();
  await expect(page.locator(".delivery-body")).not.toContainText(
    "TEST PURCHASE",
  );
  const token = page.url().split("/").pop();
  const zip = await page.request.post(
    `/api/delivery/${token}/30000000-0000-0000-0000-000000000001/zip`,
    { maxRedirects: 0 },
  );
  expect(zip.status()).toBe(303);
  expect(zip.headers().location).toContain("/lost-files-releases/");
});
