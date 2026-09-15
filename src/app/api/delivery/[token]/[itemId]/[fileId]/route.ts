import {
  findDeliveryOrder,
  hasDeliveryAccess,
  deliveryTarget,
} from "@/lib/order-delivery";
import { adminDatabase } from "@/lib/supabase/admin";
import { signPrivateDownload } from "@/lib/private-download";
export const runtime = "nodejs";
const headers = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};
function unavailable(request: Request) {
  // Browser navigation gets recovery options; fetch clients retain the 404.
  if (request.headers.get("accept")?.includes("text/html"))
    return new Response(null, {
      status: 303,
      headers: { ...headers, Location: "/downloads/unavailable" },
    });
  return new Response("Download not found", { status: 404, headers });
}
async function download(
  request: Request,
  {
    params,
  }: { params: Promise<{ token: string; itemId: string; fileId: string }> },
) {
  if (
    request.method === "POST" &&
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return new Response("Forbidden", { status: 403, headers });
  const { token, itemId, fileId } = await params;
  try {
    const order = await findDeliveryOrder(token);
    const item = order?.order_items.find((item) => item.id === itemId);
    if (!order || !item) return unavailable(request);
    if (!deliveryTarget(token, itemId, fileId).startsWith("/api/delivery/"))
      return unavailable(request);
    if (!(await hasDeliveryAccess(order))) {
      const verificationUrl = `/downloads/${token}?item=${encodeURIComponent(itemId)}&file=${encodeURIComponent(fileId)}`;
      if (request.headers.get("accept")?.includes("application/json"))
        return Response.json({ url: verificationUrl }, { headers });
      return new Response(null, {
        status: 303,
        headers: {
          ...headers,
          Location: verificationUrl,
        },
      });
    }
    if (fileId === "license") {
      const license = `LOST FILES LIBRARY\n${order.is_test ? "TEST PURCHASE — DEMO LICENSE\n" : ""}\nOrder: ${order.id}\nPurchased: ${order.paid_at}\nPack: ${item.product_title}\nLicense: ${item.license_name}\n\n${item.license_terms}\n`;
      return new Response(license, {
        headers: {
          ...headers,
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="Lost-Files-License.txt"',
        },
      });
    }
    if (fileId !== "zip" && !/^[0-9a-f-]{36}$/i.test(fileId))
      return unavailable(request);
    const db = adminDatabase();
    let query = db
      .from("product_files")
      .select("bucket,object_key,download_name")
      .eq("product_id", item.product_id)
      .eq("license_id", item.license_id)
      .eq("storage_provider", "supabase")
      .eq("bucket", order.delivery_bucket)
      .eq("content_type", "application/zip");
    if (fileId !== "zip") query = query.eq("id", fileId);
    const { data: file, error } = await query.order("id").limit(1).single();
    if (error || !file) return unavailable(request);
    const signedUrl = await signPrivateDownload(db, file);
    if (request.headers.get("accept")?.includes("application/json"))
      return Response.json({ url: signedUrl }, { headers });
    return new Response(null, {
      status: 303,
      headers: { ...headers, Location: signedUrl },
    });
  } catch {
    return new Response(
      "Download temporarily unavailable. Return to your download window and try again.",
      { status: 503, headers },
    );
  }
}
export const GET = download;
export const POST = download;
