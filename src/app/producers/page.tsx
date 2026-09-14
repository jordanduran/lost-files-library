import Image from "next/image";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { producers } from "@/data/producers";
import "./producers.css";

export const metadata = {
  title: "Producer Archives | Lost Files Library",
  description: "Vote to hack producer archives and unlock their sound packs.",
};

export default function ProducersPage() {
  return (
    <div className="producer-index page-width">
      <header>
        <span>RECOVERED PRODUCERS / ACTIVE TARGETS</span>
        <h1>Producer archives.</h1>
        <p>Vote to hack each producer. Unlock their packs. Explore every file.</p>
      </header>
      <div className="producer-index-grid">
        {producers.map((producer) => (
          <Link href={`/producers/${producer.slug}`} key={producer.id} className="producer-target-card">
            <div><Image src={producer.image} alt="" fill sizes="(max-width: 700px) 100vw, 50vw" /></div>
            <span><LockKeyhole size={13} /> HACK TARGET {producer.archiveNumber}</span>
            <h2>{producer.name}</h2>
            <p>{producer.packs.length} PACK / {producer.packs.reduce((total, pack) => total + pack.tracks.length, 0)} FILES / LOCKED</p>
          </Link>
        ))}
        <article className="producer-target-card is-pending">
          <div><span>?</span></div><span>SEARCHING...</span><h2>Next producer</h2><p>ARCHIVE NOT YET RECOVERED</p>
        </article>
      </div>
    </div>
  );
}
