import assert from "node:assert/strict";
import {
  siteOrigin,
  oauthProvider,
  emailLoginEnabled,
} from "../src/lib/auth-config.ts";

// Run in a separate process; no real accounts, credentials, or emails are used.
process.env.NODE_ENV = "production";
delete process.env.SITE_URL;
assert.equal(siteOrigin(), null);
for (const invalid of [
  "not-a-url",
  "https://user:password@example.com",
  "https://example.com/path",
  "https://example.com?next=other",
  "https://example.com#hash",
  "http://example.com",
  "javascript:alert(1)",
]) {
  process.env.SITE_URL = invalid;
  assert.equal(siteOrigin(), null);
}
for (const valid of [
  "https://lost-files-example.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]) {
  process.env.SITE_URL = `${valid}/`;
  assert.equal(siteOrigin(), valid);
}
delete process.env.SITE_URL;
process.env.NODE_ENV = "development";
assert.equal(siteOrigin(), "http://localhost:3000");
delete process.env.AUTH_PROVIDER;
assert.equal(oauthProvider(), "google");
process.env.AUTH_PROVIDER = "github";
assert.equal(oauthProvider(), "github");
process.env.AUTH_PROVIDER = "unsupported";
assert.equal(oauthProvider(), "google");
delete process.env.AUTH_EMAIL_ENABLED;
assert.equal(emailLoginEnabled(), false);
process.env.AUTH_EMAIL_ENABLED = "true";
assert.equal(emailLoginEnabled(), true);
console.log(
  "Auth configuration checks passed: trusted origins, supported providers, and email opt-in.",
);
