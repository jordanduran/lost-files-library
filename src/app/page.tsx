import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Download,
  Layers3,
} from "lucide-react";
import { BeatCard } from "@/components/beats/beat-card";
import { featuredBeats } from "@/data/mock-beats";
import { BlueprintGlobe } from "@/components/home/blueprint-globe";
function StripStar() {
  return (
    <span className="strip-star" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M9 1v16M1 9h16M3.35 3.35l11.3 11.3M3.35 14.65l11.3-11.3"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
    </span>
  );
}
export default function Home() {
  return (
    <>
      <BlueprintGlobe />
      <div className="editorial-strip">
        <span>MADE TO BE FELT.</span>
        <span>ORIGINAL BEATS</span>
        <StripStar />
        <span>COMPOSITIONS</span>
        <StripStar />
        <span>SOUND PACKS</span>
        <StripStar />
        <span>YOURS TO CREATE.</span>
      </div>
      <section className="featured-section page-width">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SELECTED FOR YOUR NEXT SESSION</span>
            <h2>
              Featured Beats<span className="heading-dot">.</span>
            </h2>
          </div>
          <Link href="/beats" className="text-link">
            View all beats <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="featured-grid">
          {featuredBeats.map((beat) => (
            <BeatCard key={beat.id} beat={beat} />
          ))}
        </div>
      </section>
      <section className="creator-section page-width" id="about">
        <div className="creator-heading">
          <span className="eyebrow">LESS FRICTION. MORE CREATION.</span>
          <h2>
            Built for
            <br />
            creators.
          </h2>
          <p>
            From the first idea to the final release.
            <br />
            We make room for your sound.
          </p>
          <Link href="/beats" className="text-link">
            Make your next move <ArrowRight size={17} />
          </Link>
        </div>
        <div className="benefits">
          {[
            {
              icon: AudioLines,
              title: "High-quality audio",
              text: "Carefully crafted sounds. Studio-quality files. Every detail, considered.",
            },
            {
              icon: Layers3,
              title: "Flexible licenses",
              text: "Choose the package that fits your process, from first demo to finished release.",
            },
            {
              icon: Download,
              title: "Instant access",
              text: "A library built to keep your purchased sounds close, whenever inspiration hits.",
            },
          ].map(({ icon: Icon, title, text }, i) => (
            <div className="benefit" key={title}>
              <span className="benefit-number">0{i + 1}</span>
              <Icon size={23} strokeWidth={1.3} />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="producer-strip page-width" id="producers">
        <span className="eyebrow">THE PEOPLE BEHIND THE SOUND</span>
        <div>
          <span>Jordan</span>
          <span>Milo</span>
          <span>Avery</span>
        </div>
        <p>
          Independent producers.
          <br />A shared attention to detail.
        </p>
      </section>
    </>
  );
}
