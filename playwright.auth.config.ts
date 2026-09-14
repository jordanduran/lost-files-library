import { defineConfig } from "@playwright/test";
process.env.AUTH_SESSION_TEST = "true";
export default defineConfig({
  testDir: "./tests",
  testMatch: "session-flow.spec.ts",
  workers: 1,
  use: { baseURL: "http://localhost:3200", channel: "chrome", headless: true },
  webServer: {
    command:
      "node --import ./tests/fixtures/mock-auth-service.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3200",
    url: "http://localhost:3200/login",
    env: { SITE_URL: "http://localhost:3200", AUTH_PROVIDER: "google", DOWNLOAD_BUCKET: "lost-files-demo", SUPABASE_SECRET_KEY: "test-server-key" },
    reuseExistingServer: false,
    timeout: 60000,
  },
});
