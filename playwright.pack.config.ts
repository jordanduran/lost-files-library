import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", testMatch: "pack-delivery.spec.ts", workers: 1,
  use: { baseURL: "http://localhost:3400", channel: "chrome", headless: true },
  webServer: {
    command: "node --import ./tests/fixtures/mock-pack-service.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3400",
    url: "http://localhost:3400/packs/checkout", reuseExistingServer: false, timeout: 60000,
    env: { SITE_URL:"http://localhost:3400", DOWNLOAD_BUCKET:"lost-files-demo", SUPABASE_SECRET_KEY:"test-server-key", STRIPE_SECRET_KEY:"sk_test_fixture", STRIPE_WEBHOOK_SECRET:"whsec_fixture", PURCHASE_EMAIL_ENABLED:"false" },
  },
});
