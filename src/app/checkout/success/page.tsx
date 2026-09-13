import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PurchaseStatus } from "@/components/cart/purchase-status";

export default async function CheckoutSuccess({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const user = await requireUser();
  const { order: id } = await searchParams;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const client = await createClient();
  const { data: order, error } = await client!.from("orders").select("id,status,order_items(product_id,license_id)").eq("id", id).eq("user_id", user.id).single();
  if (error || !order) notFound();
  return <div className="page-width cart-page"><div className="page-intro">
    <span className="eyebrow">ORDER CONFIRMATION</span>
    <h1>{order.status === "paid" ? "Added to your library." : "Checking your payment."}</h1>
    <PurchaseStatus status={order.status} items={order.order_items.map(item => ({ beatId: item.product_id, licenseId: item.license_id }))} />
    <Link className="text-link" href="/library">Open My Library</Link>
  </div></div>;
}
