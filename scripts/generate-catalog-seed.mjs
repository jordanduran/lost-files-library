import { writeFile } from "node:fs/promises";
import { beats } from "../src/data/mock-beats.ts";

const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const array = (values) => `array[${values.map(quote).join(",")}]::text[]`;
let sql =
  "-- Demo catalog only. No accounts, paid orders, or private files are seeded.\n-- Run after migrations. Existing catalog rows are preserved.\nbegin;\n";
for (const beat of beats) {
  sql += `insert into public.products (id, slug, title, producer, genre, mood, bpm, musical_key, duration_seconds, artwork, preview_url, published) values (${[beat.id, beat.slug, beat.title, beat.producer, beat.genre].map(quote).join(",")}, ${array(beat.mood)}, ${beat.bpm}, ${quote(beat.key)}, ${beat.duration}, ${quote(beat.artwork)}, ${quote(beat.previewUrl)}, true) on conflict (id) do nothing;\n`;
  for (const license of beat.licenses) {
    sql += `insert into public.product_licenses (product_id, id, name, description, includes, price_cents) values (${[beat.id, license.id, license.name, license.description].map(quote).join(",")}, ${array(license.includes)}, ${Math.round(license.price * 100)}) on conflict (product_id, id) do nothing;\n`;
  }
}
sql += "commit;\n";
await writeFile(new URL("../supabase/seed.sql", import.meta.url), sql);
console.log("Generated supabase/seed.sql");
