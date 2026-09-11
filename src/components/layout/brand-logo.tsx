import Image from "next/image";
import { brand } from "@/lib/config";

export function BrandLogo() {
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
      <span>{brand.name}</span>
    </>
  );
}
