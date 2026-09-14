import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deliveryOrder } from "@/lib/order-delivery";
import { adminDatabase } from "@/lib/supabase/admin";
import { ClearPurchasedPacks } from "@/components/packs/clear-purchased-packs";
import "../downloads.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your downloads",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function Downloads({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await deliveryOrder(token);
  if (!order) notFound();
  const items = await Promise.all(
    order.order_items.map(async (item) => {
      const { data: files, error } = await adminDatabase()
        .from("product_files")
        .select("id,download_name")
        .eq("product_id", item.product_id)
        .eq("license_id", item.license_id)
        .eq("storage_provider", "supabase")
        .eq("bucket", process.env.DOWNLOAD_BUCKET || "lost-files-demo")
        .eq("content_type", "application/zip");
      if (error)
        throw new Error(
          "Downloads are temporarily unavailable. Please try again.",
        );
      return { ...item, files: files ?? [] };
    }),
  );
  return (
    <div className="page-width delivery-page">
      <section className="delivery-window">
        <ClearPurchasedPacks packIds={items.map((item) => item.product_id)} />
        <div className="delivery-title">
          C:&#92;LOST_FILES&#92;DOWNLOADS <span aria-hidden="true">_ □ ×</span>
        </div>
        <div className="delivery-menu">File &nbsp; View &nbsp; Help</div>
        <div className="delivery-body">
          <span className="eyebrow">PAYMENT VERIFIED / ACCESS GRANTED</span>
          <h1>Your pack is ready.</h1>
          <p>
            Download the full collection and your purchase license. No sign-in
            needed.
          </p>
          {items.map((item) => (
            <article key={item.id} className="delivery-item">
              <h2>{item.product_title}</h2>
              <p>{item.license_name}</p>
              <div className="delivery-actions">
                {item.files.map((file) => (
                  <form
                    key={file.id}
                    method="post"
                    action={`/api/delivery/${token}/${item.id}/${file.id}`}
                  >
                    <button className="delivery-button">↓ Download ZIP</button>
                  </form>
                ))}
                <form
                  method="post"
                  action={`/api/delivery/${token}/${item.id}/license`}
                >
                  <button className="delivery-button">
                    ↓ Download license
                  </button>
                </form>
              </div>
              {!item.files.length && (
                <p>
                  The ZIP is temporarily unavailable. Please return to this link
                  shortly.
                </p>
              )}
              <details>
                <summary>Read license terms</summary>
                <p>{item.license_terms}</p>
              </details>
            </article>
          ))}
          <p>
            Keep this link private. Anyone with it can access these downloads.
          </p>
          {order.is_test && (
            <p className="delivery-note">
              TEST PURCHASE · Synthetic demo files. No real money was charged.
            </p>
          )}
        </div>
        <div className="delivery-footer">
          {items.length} pack(s) · ZIP + LICENSE · LOST FILES LIBRARY
        </div>
      </section>
    </div>
  );
}
