import { storePacks, type StorePack } from "@/data/store-packs";
import { producers } from "@/data/producers";
// One cart for direct packs and producer archive packs. Premium placeholders stay locked.
export const purchasePacks: StorePack[] = [
  ...storePacks,
  ...producers.flatMap((producer) =>
    producer.packs.map((pack) => ({
      id: pack.id,
      title: pack.title,
      producer: producer.name,
      description: pack.description,
      files: pack.tracks.length,
      format: pack.format,
      cover: pack.cover,
      price: pack.price,
      trackIds: pack.tracks.map((track) => track.id),
      art: "vault" as const,
    })),
  ),
];
