import { HomeLanding } from "@/components/home/home-landing";
import { producers } from "@/data/producers";

export default function Home() {
  return <HomeLanding producer={producers[0]} />;
}
