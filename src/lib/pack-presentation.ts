import type { PublicPack } from "../types/managed-pack";
import type { StorePack } from "../data/store-packs";
export function asStorePack(p: PublicPack): StorePack {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    producer: p.producer,
    description: p.details.description,
    files: p.details.tracks.length,
    format: p.details.format,
    price: p.price,
    cover: p.details.cover,
    art: "signal",
    trackIds: p.details.tracks.map((t) => t.id),
    tracks: p.details.tracks,
    locked: p.details.locked,
  };
}
