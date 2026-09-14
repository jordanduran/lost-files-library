import type { StorePack } from "@/data/store-packs";

export function PackArt({
  pack,
  premium = false,
}: {
  pack: StorePack;
  premium?: boolean;
}) {
  return (
    <div className={`store-pack-art art-${pack.art}`}>
      <span>{premium ? "PREMIUM DRIVE" : "DIRECT ACCESS"}</span>
      <strong>{pack.title}</strong>
      <small>{pack.id.toUpperCase()}</small>
    </div>
  );
}
