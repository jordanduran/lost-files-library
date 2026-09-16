import { getUser } from "@/lib/auth";
import { getPurchasedProductIds } from "@/lib/library";
import { notFound } from "next/navigation";
import { ProducerHack } from "@/components/producers/producer-hack";
import { publicPacks, asProducer } from "@/lib/managed-packs";
async function getProducer(slug: string) {
  const pack = (await publicPacks()).find(
    (p) =>
      p.slug === slug ||
      p.producer
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") === slug,
  );
  return pack ? asProducer(pack) : undefined;
}

type ProducerPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProducerPageProps) {
  const { slug } = await params;
  const producer = await getProducer(slug);
  return {
    title: producer ? `${producer.name} Archive` : "Producer not found",
  };
}

export default async function ProducerPage({ params }: ProducerPageProps) {
  const { slug } = await params;
  const producer = await getProducer(slug);
  if (!producer) notFound();
  const user = await getUser();
  const purchasedPackIds = user ? await getPurchasedProductIds(user.id) : [];
  return (
    <ProducerHack producer={producer} purchasedPackIds={purchasedPackIds} />
  );
}
