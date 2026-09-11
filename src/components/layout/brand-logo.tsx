import Image from "next/image";
import { brand } from "@/lib/config";

export function BrandLogo({ library = false }: { library?: boolean }) {
  return (
    <>
      <Image
        className="brand-mark"
        src="/brand/lost-files-mark.webp"
        width={600}
        height={600}
        alt=""
        unoptimized
      />
      {library ? (
        <span className="nav-brand-text">
          <span>Lost Files</span>
          <span>Library</span>
        </span>
      ) : (
        <span>{brand.name}</span>
      )}
    </>
  );
}
