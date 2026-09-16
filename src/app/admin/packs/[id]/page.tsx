import { editorPacks, emptyPack, requireAdmin } from "@/lib/managed-packs";
import { PackEditor } from "@/components/admin/pack-editor";
import { notFound } from "next/navigation";
import Link from "next/link";
import "../../admin.css";
export const metadata = {
  title: "Edit pack",
  robots: { index: false, follow: false },
};
export default async function EditPack({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const pack =
    id === "new" ? emptyPack() : (await editorPacks()).find((p) => p.id === id);
  if (!pack) notFound();
  return (
    <section className="page-width pack-admin">
      <header className="page-intro">
        <Link href="/admin">← All packs</Link>
        <h1>{id === "new" ? "New pack." : pack.title}</h1>
      </header>
      <PackEditor initial={pack} />
    </section>
  );
}
