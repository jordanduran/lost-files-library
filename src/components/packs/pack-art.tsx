import type { StorePack } from "@/data/store-packs";
import Image from "next/image";

export function PackArt({
  pack,
  premium = false,
}: {
  pack: StorePack;
  premium?: boolean;
}) {
  if (pack.cover)
    return (
      <div className="store-pack-art has-pack-cover">
        <Image
          src={pack.cover}
          alt={`${pack.title} cover`}
          fill
          sizes="(max-width: 800px) 88px, 240px"
        />
      </div>
    );
  return (
    <div className={`store-pack-art art-${pack.art}`}>
      <span>{premium ? "PREMIUM DRIVE" : "DIRECT ACCESS"}</span>
      <strong>{pack.title}</strong>
      <small>{pack.id.toUpperCase()}</small>
    </div>
  );
}
