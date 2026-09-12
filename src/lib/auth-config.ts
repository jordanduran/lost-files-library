import "server-only";

export function oauthProvider(): "google" | "github" {
  return process.env.AUTH_PROVIDER === "github" ? "github" : "google";
}

export function emailLoginEnabled() {
  return process.env.AUTH_EMAIL_ENABLED === "true";
}

export function siteOrigin() {
  // Set per environment, never derive an OAuth destination from a supplied Host header.
  const configured =
    process.env.SITE_URL ||
    (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "");
  if (!configured) return null;
  try {
    const url = new URL(configured);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.protocol !== "https:" && !(local && url.protocol === "http:"))
      return null;
    if (
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}
