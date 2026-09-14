import { notFound } from "next/navigation";
import { ProducerHack } from "@/components/producers/producer-hack";
import { getProducer, producers } from "@/data/producers";

export function generateStaticParams() {
  return producers.map((producer) => ({ slug: producer.slug }));
}

type ProducerPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProducerPageProps) {
  const { slug } = await params;
  const producer = getProducer(slug);
  return { title: producer ? `${producer.name} Archive` : "Producer not found" };
}

export default async function ProducerPage({ params }: ProducerPageProps) {
  const { slug } = await params;
  const producer = getProducer(slug);
  if (!producer) notFound();
  return <ProducerHack producer={producer} />;
}
