import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { beats } from "@/data/mock-beats";
import { ProductDetail } from "@/components/beats/product-detail";
import { RelatedBeats } from "@/components/beats/related-beats";
export function generateStaticParams() {
  return beats.map((beat) => ({ slug: beat.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const beat = beats.find((b) => b.slug === slug);
  return { title: beat?.title ?? "Beat not found" };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const beat = beats.find((b) => b.slug === slug);
  if (!beat) notFound();
  return (
    <div className="page-width product-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/beats">Beats</Link>
        <ChevronRight size={12} />
        <span>{beat.title}</span>
      </nav>
      <ProductDetail beat={beat} />
      <RelatedBeats excludeId={beat.id} />
    </div>
  );
}
