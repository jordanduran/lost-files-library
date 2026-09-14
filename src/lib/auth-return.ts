export function safeAuthReturn(value: unknown) {
  return typeof value === "string" &&
    (value === "/packs/checkout" || /^\/downloads\/[a-f0-9]{64}$/.test(value))
    ? value
    : "/library";
}
