import type { Metadata } from "next";
import Link from "next/link";
import { editorPacks } from "@/lib/managed-packs";
import "./admin.css";
export const metadata: Metadata = {
  title: "Studio Admin",
  robots: { index: false, follow: false },
};
export default async function AdminPage() {
  const packs = await editorPacks();
  return (
    <section className="page-width pack-admin">
      <header className="page-intro">
        <span className="eyebrow">STUDIO / PACKS</span>
        <h1>Manage packs.</h1>
        <p>Draft, preview, and publish your releases.</p>
        <Link href="/admin/packs/new">Add pack</Link>
      </header>
      <div className="pack-admin-list">
        {packs.map((pack) => (
          <Link key={pack.id} href={`/admin/packs/${pack.id}`}>
            <strong>{pack.title}</strong>
            <span>
              {pack.producer} · ${pack.price}
            </span>
            <span>
              {pack.status} · {pack.details.locked ? "Locked" : "Unlocked"}
              {pack.featured ? " · Featured" : ""}
              {pack.liveReady ? " · Live ready" : ""}
            </span>
          </Link>
        ))}
        {!packs.length && <p>No packs yet. Add your first draft.</p>}
      </div>
    </section>
  );
}
