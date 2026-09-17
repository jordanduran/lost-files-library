import type { Metadata } from "next";
import { PurchasedLibrary } from "@/components/account/purchased-library";
import { getUser } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getLibrary, type LibraryItem } from "@/lib/library";
import { publicPacks } from "@/lib/managed-packs";
import { asStorePack } from "@/lib/pack-presentation";
import { storePacks } from "@/data/store-packs";
import "./library.css";
export const metadata: Metadata = {
  title: "My Library",
  robots: { index: false, follow: false },
};
export default async function LibraryPage() {
  const user = await getUser();
  if (!user)
    return (
      <section className="account-panel">
        <span className="eyebrow">YOUR PURCHASED FILES</span>
        <h1>My Library</h1>
        <p>
          Sign in to see your saved purchases, or find the packs you bought as a
          guest.
        </p>
        <div className="account-form">
          <Button asChild>
            <Link href="/login?next=/library">Sign in to My Library</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/recover">Find purchases by email</Link>
          </Button>
        </div>
      </section>
    );
  let items: LibraryItem[] = [];
  let unavailable = false;
  try {
    items = await getLibrary(user.id);
  } catch {
    unavailable = true;
  }
  // Artwork is optional: a catalog outage must never hide purchased downloads.
  const catalog = items.length ? await publicPacks().catch(() => []) : [];
  const artwork = Object.fromEntries(
    items.map((item) => {
      const pack = catalog.find((pack) => pack.id === item.product_id);
      const presentation = pack
        ? asStorePack(pack)
        : storePacks.find((pack) => pack.id === item.product_id);
      return [
        item.id,
        {
          cover: presentation?.cover ?? "",
          producer: presentation?.producer ?? "",
          art: presentation?.art ?? "signal",
        },
      ];
    }),
  );
  return (
    <PurchasedLibrary
      artwork={artwork}
      items={items}
      unavailable={unavailable}
    />
  );
}
