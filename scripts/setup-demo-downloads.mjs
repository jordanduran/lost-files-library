// Upload only original synthetic demo fixtures. Never upload real release assets here.
import { loadEnvFile } from "node:process";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
try { loadEnvFile(".env.local"); } catch { /* Environment may be supplied directly. */ }
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) throw new Error("Supabase server configuration is missing");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const bucket = "lost-files-demo";
const { data: buckets, error: listError } = await db.storage.listBuckets();
if (listError) throw new Error("Cannot inspect storage buckets");
const existing = buckets.find(item => item.id === bucket);
if (existing?.public) throw new Error("Demo bucket must be private; refusing to upload");
if (!existing) {
  const { error } = await db.storage.createBucket(bucket, { public: false, fileSizeLimit: 5242880, allowedMimeTypes: ["audio/wav"] });
  if (error) throw new Error("Could not create private demo bucket");
}
for (let i = 1; i <= 8; i++) {
  const productId = `beat-${i}`;
  const bytes = await readFile(new URL(`../public/audio/demo/${productId}.wav`, import.meta.url));
  const key = `${productId}/synthetic-demo.wav`;
  const { error: uploadError } = await db.storage.from(bucket).upload(key, bytes, { contentType: "audio/wav", upsert: false });
  if (uploadError && String(uploadError.statusCode) !== "409" && !/already exists/i.test(uploadError.message)) throw new Error(`Demo upload failed for ${productId}`);
  const { data: licenses, error } = await db.from("product_licenses").select("id").eq("product_id", productId);
  if (error) throw new Error("Could not read demo licenses");
  for (const license of licenses) {
    const { error: fileError } = await db.from("product_files").upsert({ product_id: productId, license_id: license.id, storage_provider: "supabase", bucket, object_key: key, download_name: `${productId}-synthetic-demo.wav`, content_type: "audio/wav", size_bytes: bytes.length }, { onConflict: "product_id,license_id,storage_provider,bucket,object_key", ignoreDuplicates: true });
    if (fileError) throw new Error(`Could not map demo file for ${productId}`);
  }
}
console.log("Private synthetic demo downloads prepared for 8 beats. All licenses receive a clearly labeled demo WAV, not production MP3/stem assets.");
