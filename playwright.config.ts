import { defineConfig } from "@playwright/test";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3300";
export default defineConfig({
  testDir: "./tests",
  // These suites require their own isolated service preload and configuration.
  testIgnore: [
    "**/pack-delivery.spec.ts",
    "**/session-flow.spec.ts",
    "**/purchase-recovery.spec.ts",
    "**/live-checkout.spec.ts",
    "**/pack-management.spec.ts",
  ],
  fullyParallel: true,
  workers: 2,
  use: { baseURL, channel: "chrome", headless: true },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command:
          "node --import ./tests/fixtures/mock-auth-service.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3300",
        url: baseURL,
        env: { SITE_URL: baseURL },
        reuseExistingServer: false,
        timeout: 60000,
      },
});
