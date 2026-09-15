import { defineConfig } from "@playwright/test";
// Fake keys and an isolated service preload: this suite never charges a card.
export default defineConfig({
  testDir: "./tests",
  testMatch: "live-checkout.spec.ts",
  workers: 1,
  projects: [{ name: "mock-live" }],
  use: { baseURL: "http://localhost:3400", channel: "chrome", headless: true },
  webServer: process.env.PACK_TEST_EXTERNAL_SERVER
    ? undefined
    : {
        command:
          "node --import ./tests/fixtures/mock-pack-service.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3400",
        url: "http://localhost:3400/cart",
        reuseExistingServer: false,
        timeout: 60000,
        env: {
          SITE_URL: "http://localhost:3400",
          CHECKOUT_MODE: "live",
          LIVE_PAYMENTS_ENABLED: "true",
          AUTH_TEST_EMAIL: "guest@example.test",
          SUPABASE_SECRET_KEY: "test-server-key",
          STRIPE_SECRET_KEY: "sk_live_fixture",
          STRIPE_WEBHOOK_SECRET: "whsec_fixture",
          PURCHASE_EMAIL_ENABLED: "false",
        },
      },
});
