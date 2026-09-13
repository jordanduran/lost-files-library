import { defineConfig } from "@playwright/test";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3300";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 2,
  use: { baseURL, channel: "chrome", headless: true },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command:
          "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3300",
        url: baseURL,
        env: { SITE_URL: baseURL },
        reuseExistingServer: false,
        timeout: 60000,
      },
});
