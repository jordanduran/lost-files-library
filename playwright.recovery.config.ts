import { defineConfig } from "@playwright/test";
const baseURL = "http://localhost:3500";
export default defineConfig({
  testDir: "./tests",
  testMatch: "purchase-recovery.spec.ts",
  workers: 1,
  use: { baseURL, channel: "chrome", headless: true },
  webServer: {
    command:
      "node --import ./tests/fixtures/mock-recovery-service.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3500",
    url: baseURL,
    reuseExistingServer: false,
    env: {
      SITE_URL: baseURL,
      PURCHASE_EMAIL_ENABLED: "true",
      SUPABASE_SECRET_KEY: "recovery-fixture-key",
      RESEND_API_KEY: "re_fixture",
      PURCHASE_EMAIL_FROM: "test@example.test",
      SUPPORT_EMAIL: "help@example.test",
    },
  },
});
