import { ProducerHack } from "@/components/producers/producer-hack";
import { producers } from "@/data/producers";

export default function Home() {
  return <ProducerHack producer={producers[0]} />;
}
