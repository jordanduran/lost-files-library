import { writeFile } from "node:fs/promises";
import { producers } from "../src/data/producers.ts";
import { storePacks } from "../src/data/store-packs.ts";
import { beats } from "../src/data/mock-beats.ts";
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const packs = [
  ...producers.flatMap((p) =>
    p.packs.map((pack) => ({
      id: pack.id,
      featured: true,
      details: {
        description: pack.description,
        artistImage: p.image,
        artistBio: p.bio,
        artistRole: p.role,
        cover: pack.cover,
        format: pack.format,
        catalogNumber: pack.catalogNumber,
        locked: true,
        tracks: pack.tracks,
      },
    })),
  ),
  ...storePacks.map((p, i) => ({
    id: p.id,
    featured: false,
    details: {
      description: p.description,
      artistImage: "",
      artistBio: "",
      artistRole: "Producer",
      cover: p.cover ?? "",
      format: p.format,
      catalogNumber: `LFL-STORE-${i + 1}`,
      locked: false,
      tracks: p.trackIds
        .map((id) => beats.find((t) => t.id === id))
        .filter(Boolean)
        .map((t) => ({
          id: t.id,
          title: t.title,
          genre: t.genre,
          bpm: t.bpm,
          key: t.key,
          duration: t.duration,
          previewDuration: t.previewDuration ?? 15,
          previewUrl: t.previewUrl,
        })),
    },
  })),
];
let sql =
  "-- Preserve existing prices, publication flags, tester access, and private files.\nbegin;\n";
for (const [i, p] of packs.entries())
  sql += `insert into public.pack_listings(product_id,details,featured,sort_order) select id,${quote(JSON.stringify(p.details))}::jsonb,${p.featured},${i} from public.products where id=${quote(p.id)} and kind='pack' on conflict(product_id) do nothing;\n`;
sql += "commit;\n";
await writeFile(
  new URL(
    "../supabase/migrations/202609160002_seed_pack_presentation.sql",
    import.meta.url,
  ),
  sql,
);
console.log("Generated presentation metadata for existing packs only.");
