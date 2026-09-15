export function paymentMode(env = process.env): "test" | "live" | null {
  const mode = env.CHECKOUT_MODE ?? "test";
  return mode === "test" || mode === "live" ? mode : null;
}

export function paymentCredentials(test: boolean, env = process.env) {
  const key =
    (test ? env.STRIPE_TEST_SECRET_KEY : env.STRIPE_LIVE_SECRET_KEY) ||
    env.STRIPE_SECRET_KEY;
  const webhook =
    (test ? env.STRIPE_TEST_WEBHOOK_SECRET : env.STRIPE_LIVE_WEBHOOK_SECRET) ||
    env.STRIPE_WEBHOOK_SECRET;
  if (!test && env.LIVE_PAYMENTS_ENABLED !== "true") return null;
  if (!key?.startsWith(test ? "sk_test_" : "sk_live_") || !webhook) return null;
  return { key, webhook };
}

export function orderBucket(test: boolean) {
  return test ? "lost-files-demo" : "lost-files-releases";
}
