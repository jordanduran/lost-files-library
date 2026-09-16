import { publicPacks, asProducer } from "@/lib/managed-packs";
import { ProducerHack } from "@/components/producers/producer-hack";
import { getUser } from "@/lib/auth";
import { getPurchasedProductIds } from "@/lib/library";
import { notFound } from "next/navigation";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pack = (await publicPacks()).find((p) => p.slug === slug);
  return { title: pack?.title ?? "Pack unavailable" };
}
export default async function PackPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pack = (await publicPacks()).find((p) => p.slug === slug);
  if (!pack) notFound();
  const user = await getUser();
  return (
    <ProducerHack
      producer={asProducer(pack)}
      purchasedPackIds={user ? await getPurchasedProductIds(user.id) : []}
    />
  );
}
