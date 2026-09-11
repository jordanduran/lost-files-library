import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Download,
  Layers3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Artwork } from "@/components/beats/artwork";
import { BeatCard } from "@/components/beats/beat-card";
import { PlayButton } from "@/components/audio/play-button";
import { featuredBeats } from "@/data/mock-beats";
export default function Home() {
  return (
    <>
      <section className="hero page-width">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="status-dot" /> INDEPENDENT SOUNDS. ENDLESS
            POSSIBILITIES.
          </div>
          <h1>
            High quality
            <br />
            sounds for your
            <br />
            <span>next chapter.</span>
          </h1>
          <p>
            Original compositions, beats, and sound packs
            <br className="desktop-break" /> made for artists and creators.
          </p>
          <div className="hero-buttons">
            <Button asChild>
              <Link href="/beats">
                Browse Beats <ArrowUpRight />
              </Link>
            </Button>
            <div className="listen-button">
              <PlayButton id="beat-1" title="Midnight Drive" />
              <span>
                Listen <small>VISUAL PREVIEW</small>
              </span>
            </div>
          </div>
          <div className="hero-caption">
            <span>CURATED, NOT CROWDED.</span>
            <span>VOL. 001 — THE FIRST CHAPTER</span>
          </div>
        </div>
        <div className="hero-art">
          <Artwork kind="hero" />
          <div className="hero-art-top">
            <span>THE LOST FILES COLLECTION</span>
            <ArrowUpRight size={22} />
          </div>
          <div className="hero-art-bottom">
            <div>
              <span>FEATURED SOUND / 001</span>
              <h2>Midnight Drive</h2>
              <p>
                Jordan <span>142 BPM · F#m</span>
              </p>
            </div>
            <PlayButton id="beat-1" title="Midnight Drive" />
          </div>
          <span className="art-side-label">SOUND WITHOUT LIMITS</span>
        </div>
      </section>
      <div className="editorial-strip">
        <span>MADE TO BE FELT.</span>
        <span>ORIGINAL BEATS</span>
        <span className="strip-star">✳</span>
        <span>COMPOSITIONS</span>
        <span className="strip-star">✳</span>
        <span>SOUND PACKS</span>
        <span className="strip-star">✳</span>
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
