import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "pack-management.spec.ts",
  workers: 1,
  use: { baseURL: "http://localhost:3600", channel: "chrome", headless: true },
  webServer: {
    command:
      "node --import ./tests/fixtures/mock-management-service.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3600",
    url: "http://localhost:3600/login",
    env: {
      SITE_URL: "http://localhost:3600",
      SUPABASE_SECRET_KEY: "test-server-key",
    },
    reuseExistingServer: false,
    timeout: 60000,
  },
});
