import type { Metadata } from "next";
import { PurchasedLibrary } from "@/components/account/purchased-library";
import { requireUser } from "@/lib/auth";
import { getLibrary, type LibraryItem } from "@/lib/library";
export const metadata: Metadata = {
  title: "My Library",
  robots: { index: false, follow: false },
};
export default async function LibraryPage() {
  const user = await requireUser();
  let items: LibraryItem[] = [];
  let unavailable = false;
  try {
    items = await getLibrary(user.id);
  } catch {
    unavailable = true;
  }
  return (
    <PurchasedLibrary
      email={user.email ?? "Your account"}
      items={items}
      unavailable={unavailable}
    />
  );
}
