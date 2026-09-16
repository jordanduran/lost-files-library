import { getUser } from "@/lib/auth";
import { getPurchasedProductIds } from "@/lib/library";
import { notFound, permanentRedirect } from "next/navigation";
import { publicPacks } from "@/lib/managed-packs";
import { groupProducers, producerSlug } from "@/lib/producer-directory";
import { ProducerPageContent } from "@/components/producers/producer-page-content";
import "../directory.css";
type Props = { params: Promise<{ slug: string }> };
async function findProducer(slug: string) {
  const packs = await publicPacks();
  return groupProducers(packs).find((p) => p.slug === slug);
}
export async function generateMetadata({ params }: Props) {
  const p = await findProducer((await params).slug);
  return { title: p ? `${p.producer.name} Archive` : "Producer not found" };
}
export default async function ProducerPage({ params }: Props) {
  const { slug } = await params;
  const entry = await findProducer(slug);
  if (!entry) {
    const alias = (await publicPacks()).find((p) => p.slug === slug);
    if (alias) permanentRedirect(`/producers/${producerSlug(alias.producer)}`);
    notFound();
  }
  const user = await getUser();
  return (
    <ProducerPageContent
      producer={entry.producer}
      packs={entry.packs}
      purchasedPackIds={user ? await getPurchasedProductIds(user.id) : []}
    />
  );
}
