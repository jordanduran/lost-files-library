// Explicit sandbox setup. Requires the pack migration and existing synthetic WAV fixtures.
import { loadEnvFile } from "node:process";
import { readFile } from "node:fs/promises";
import { crc32 } from "node:zlib";
import { createClient } from "@supabase/supabase-js";
try { loadEnvFile(".env.local"); } catch { /* Environment can be supplied directly. */ }
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) throw new Error("Missing database configuration");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const terms = "DEMO LICENSE ONLY. These original synthetic test sounds are provided solely to test checkout and downloads. This is not the final After Hours release or a commercial beat license. No rights to unreleased production beats are granted.";
const tracks = ["beat-1-synthetic-demo.wav", "beat-2-synthetic-demo.wav"];
const files = await Promise.all(tracks.map((name, i) => readFile(new URL(`../public/audio/demo/beat-${i + 1}.wav`, import.meta.url)).then(data => ({ name, data }))));
files.push({ name: "DEMO-LICENSE.txt", data: Buffer.from(terms) });
// ZIP's stored method needs no compression dependency; these are tiny test assets.
const local = [], central = [];
let offset = 0;
for (const file of files) {
  const name = Buffer.from(file.name), checksum = crc32(file.data);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20,4); header.writeUInt16LE(33,12);
  header.writeUInt32LE(checksum,14); header.writeUInt32LE(file.data.length,18); header.writeUInt32LE(file.data.length,22); header.writeUInt16LE(name.length,26);
  local.push(header,name,file.data);
  const entry = Buffer.alloc(46);
  entry.writeUInt32LE(0x02014b50); entry.writeUInt16LE(20,4); entry.writeUInt16LE(20,6); entry.writeUInt16LE(33,14);
  entry.writeUInt32LE(checksum,16); entry.writeUInt32LE(file.data.length,20); entry.writeUInt32LE(file.data.length,24); entry.writeUInt16LE(name.length,28); entry.writeUInt32LE(offset,42);
  central.push(entry,name); offset += header.length + name.length + file.data.length;
}
const directory = Buffer.concat(central), end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50); end.writeUInt16LE(files.length,8); end.writeUInt16LE(files.length,10); end.writeUInt32LE(directory.length,12); end.writeUInt32LE(offset,16);
const zip = Buffer.concat([...local,directory,end]);
const bucket = "lost-files-demo";
const { data: existing, error: bucketError } = await db.storage.getBucket(bucket);
if (bucketError || !existing || existing.public) throw new Error("Create a private lost-files-demo bucket first");
// Preserve existing bucket settings while enabling the new archive format.
const { error: settingsError } = await db.storage.updateBucket(bucket, { public: false, allowedMimeTypes: [...new Set([...(existing.allowed_mime_types ?? ["audio/wav"]), "application/zip"])], fileSizeLimit: existing.file_size_limit ?? 5242880 });
if (settingsError) throw new Error("Could not enable ZIP uploads");
const key = "after-hours-001/synthetic-demo-v1.zip";
const { error: uploadError } = await db.storage.from(bucket).upload(key,zip,{contentType:"application/zip",upsert:false});
if (uploadError && String(uploadError.statusCode)!=="409" && !/already exists/i.test(uploadError.message)) throw new Error("ZIP upload failed");
for (const [table, value, conflict] of [
  ["products", { id:"after-hours-001", slug:"after-hours-001",title:"After Hours / Vol. 001 (Demo)",producer:"Lost Files Library",genre:"Demo",bpm:80,musical_key:"C",duration_seconds:20,artwork:"paper",kind:"pack",pack_tracks:tracks,published:true }, "id"],
  ["product_licenses", { product_id:"after-hours-001",id:"pack",name:"Demo Pack License",description:terms,includes:["2 synthetic demo WAVs","ZIP","License"],price_cents:100,currency:"USD" }, "product_id,id"],
  ["product_files", { product_id:"after-hours-001",license_id:"pack",storage_provider:"supabase",bucket,object_key:key,download_name:"After-Hours-SYNTHETIC-DEMO.zip",content_type:"application/zip",size_bytes:zip.length }, "product_id,license_id,storage_provider,bucket,object_key"],
]) {
  const { error } = await db.from(table).upsert(value,{onConflict:conflict,ignoreDuplicates:true});
  if (error) throw new Error(`Demo pack setup failed in ${table}`);
}
console.log("Demo pack prepared: two synthetic WAVs, ZIP and demo license; $1 Stripe test price. Existing catalog values preserved.");
