"use server";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { siteOrigin } from "@/lib/auth-config";
import { checkoutDatabase, checkoutReady, stripeClient } from "@/lib/checkout";
import { registerPurchaseBrowser } from "@/lib/download-browser";

export async function startPackCheckout(
  input: unknown,
): Promise<{ url?: string; error?: string }> {
  if (
    !Array.isArray(input) ||
    input.length < 1 ||
    input.length > 20 ||
    input.some(
      (id) => typeof id !== "string" || !/^[a-z0-9-]{1,100}$/.test(id),
    ) ||
    new Set(input).size !== input.length
  )
    return { error: "Your pack cart is invalid." };
  const packIds = [...input].sort() as string[];
  const cartHash = createHash("sha256")
    .update(JSON.stringify(packIds))
    .digest("hex")
    .slice(0, 16);
  if (!checkoutReady()) return { error: "Test checkout is awaiting setup." };
  try {
    const jar = await cookies();
    const user = await getUser();
    const cookieName = `pack-checkout-${user?.id ?? "guest"}`;
    const previous = jar.get(cookieName)?.value;
    const credential =
      previous &&
      new RegExp(`^${cartHash}\\.[a-f0-9-]{36}\\.[a-f0-9]{64}$`).test(previous)
        ? previous
        : `${cartHash}.${randomUUID()}.${randomBytes(32).toString("hex")}`;
    jar.set(cookieName, credential, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    });
    const [, requestId, token] = credential.split(".");
    const db = checkoutDatabase();
    const { data: id, error } = await db.rpc("create_pack_order", {
      p_user: user?.id ?? null,
      p_request: requestId,
      p_token: token,
      p_products: packIds,
    });
    if (error)
      return {
        error: error.message?.includes("Tester access required")
          ? "Sign in with an approved tester email to purchase this unreleased pack."
          : error.message?.includes("Already purchased")
            ? "You already own one of these packs. Open My Library or refresh your cart."
            : "One of these packs is not ready for checkout yet. Please try again later.",
      };
    const { data: order, error: readError } = await db
      .from("orders")
      .select(
        "status,created_at,checkout_session_id,order_items(product_title,license_name,unit_price_cents)",
      )
      .eq("id", id)
      .single();
    if (readError || !order) throw new Error("Order unavailable");
    await registerPurchaseBrowser(id);
    if (order.status === "paid") return { url: `/downloads/${token}` };
    if (
      order.status !== "pending" ||
      Date.now() - Date.parse(order.created_at) > 23 * 3600000
    ) {
      jar.delete(cookieName);
      return {
        error: "Checkout expired. Please try again to start a new checkout.",
      };
    }
    const stripe = stripeClient();
    const session = order.checkout_session_id
      ? await stripe.checkout.sessions.retrieve(order.checkout_session_id)
      : await stripe.checkout.sessions.create(
          {
            mode: "payment",
            customer_email: user?.email || undefined,
            payment_method_types: ["card"],
            managed_payments: { enabled: false },
            client_reference_id: id,
            metadata: { order_id: id, checkout_kind: "pack" },
            line_items: order.order_items.map((item) => ({
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: item.unit_price_cents,
                product_data: {
                  name: `${item.product_title} — ${item.license_name}`,
                },
              },
            })),
            success_url: `${siteOrigin()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${siteOrigin()}/cart?canceled=1`,
          },
          { idempotencyKey: `pack-order-${id}` },
        );
    const { error: saveError } = await db
      .from("orders")
      .update({ checkout_session_id: session.id })
      .eq("id", id)
      .is("checkout_session_id", null);
    if (saveError) throw new Error("Could not save checkout");
    if (session.status === "complete")
      return { url: `/checkout/success?session_id=${session.id}` };
    if (!session.url || session.status === "expired") {
      jar.delete(cookieName);
      return { error: "Checkout expired. Please try again." };
    }
    return { url: session.url };
  } catch {
    return { error: "Checkout is unavailable. Please try again." };
  }
}
