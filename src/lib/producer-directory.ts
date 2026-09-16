import type { PublicPack } from "@/types/managed-pack";
import { asProducer } from "./managed-packs";
import { asStorePack } from "./pack-presentation";
export function producerKey(name: string) {
  return name.trim().toLowerCase();
}
export function producerSlug(name: string) {
  return (
    producerKey(name)
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-|-$/g, "") || "producer"
  );
}
export function groupProducers(packs: PublicPack[]) {
  const groups = new Map<string, PublicPack[]>();
  for (const pack of packs) {
    const key = producerKey(pack.producer);
    groups.set(key, [...(groups.get(key) ?? []), pack]);
  }
  return [...groups.values()].map((items) => {
    const representative =
      items.find((p) => p.featured) ??
      items.find((p) => p.details.artistImage) ??
      items[0];
    return {
      slug: producerSlug(representative.producer),
      producer: {
        ...asProducer(representative),
        image:
          items.find((p) => p.details.artistImage)?.details.artistImage ?? "",
      },
      packs: items.map(asStorePack),
    };
  });
}
