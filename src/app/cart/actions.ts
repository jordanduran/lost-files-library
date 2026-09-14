"use server";
// Retired individual-beat carts must return to the pack review before any payment.
export async function startCheckout(input: unknown): Promise<{ url?: string; error?: string }> {
  void input;
  return { url: "/cart" };
}
