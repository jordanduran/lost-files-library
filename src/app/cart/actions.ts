"use server";
import { getUser } from "@/lib/auth";
import { siteOrigin } from "@/lib/auth-config";
import { checkoutDatabase, checkoutReady, stripeClient } from "@/lib/checkout";

export async function startCheckout(input: unknown): Promise<{ url?: string; error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Sign in before checking out." };
  if (!checkoutReady()) return { error: "Test checkout is awaiting setup." };
  const cart = input as { requestId?: unknown; items?: unknown } | null;
  if (!cart || typeof cart.requestId !== "string" || !/^[0-9a-f-]{36}$/i.test(cart.requestId) || !Array.isArray(cart.items) || cart.items.length < 1 || cart.items.length > 20) return { error: "Your cart is invalid." };
  const items = cart.items.map((item) => ({ beatId: item?.beatId, licenseId: item?.licenseId }));
  if (items.some((item) => typeof item.beatId !== "string" || typeof item.licenseId !== "string" || item.beatId.length > 100 || item.licenseId.length > 100)) return { error: "Your cart is invalid." };
  try {
    const db = checkoutDatabase();
    const { data: orderId, error } = await db.rpc("create_test_order", { p_user: user.id, p_request: cart.requestId, p_items: items });
    if (error) return { error: error.message.includes("Already purchased") ? "You already own a selected license. Find it in My Library." : "Could not prepare your order. Check the catalog and try again." };
    const { data: order, error: orderError } = await db.from("orders").select("id,status,created_at,checkout_session_id,order_items(product_title,license_name,unit_price_cents)").eq("id", orderId).eq("user_id", user.id).single();
    if (orderError || !order) throw new Error("Order unavailable");
    const origin = siteOrigin();
    if (order.status === "paid") return { url: `${origin}/checkout/success?order=${order.id}` };
    if (order.status !== "pending" || Date.now() - Date.parse(order.created_at) > 23 * 60 * 60 * 1000) return { error: "This checkout expired. Remove and re-add an item to start again." };
    const stripe = stripeClient();
    const session = order.checkout_session_id
      ? await stripe.checkout.sessions.retrieve(order.checkout_session_id)
      : await stripe.checkout.sessions.create({
          mode: "payment", payment_method_types: ["card"],
          client_reference_id: order.id,
          metadata: { order_id: order.id, user_id: user.id },
          line_items: order.order_items.map((item) => ({ quantity: 1, price_data: { currency: "usd", unit_amount: item.unit_price_cents, product_data: { name: `${item.product_title} — ${item.license_name}` } } })),
          success_url: `${origin}/checkout/success?order=${order.id}`,
          cancel_url: `${origin}/cart?checkout=canceled`,
        }, { idempotencyKey: `test-order-${order.id}` });
    const { error: saveError } = await db.from("orders").update({ checkout_session_id: session.id }).eq("id", order.id).eq("user_id", user.id).is("checkout_session_id", null);
    if (saveError) throw new Error("Could not save checkout");
    if (session.status === "complete") return { url: `${origin}/checkout/success?order=${order.id}` };
    if (!session.url || session.status === "expired") return { error: "This checkout expired. Remove and re-add an item to start a new checkout." };
    return { url: session.url };
  } catch {
    return { error: "Checkout is unavailable. Your cart is saved; please try again." };
  }
}
