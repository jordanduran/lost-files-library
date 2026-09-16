import { publicPacks } from "@/lib/managed-packs";
import { groupProducers } from "@/lib/producer-directory";
import { ProducerDirectory } from "@/components/producers/producer-directory";
import "./directory.css";
export const metadata = {
  title: "Producers",
  description: "Browse producer archives and explore their sound packs.",
};
export default async function ProducersPage() {
  const producers = groupProducers(await publicPacks()).map(
    ({ slug, producer, packs }) => ({
      slug,
      name: producer.name,
      image: producer.image,
      packCount: packs.length,
    }),
  );
  return <ProducerDirectory producers={producers} />;
}
