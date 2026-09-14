"use client";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import styles from "./blueprint-globe.module.css";
import { useArchiveIntro } from "./use-archive-intro";
export function BlueprintGlobe() {
 const { sectionRef, titleRef, firstLineRef, secondLineRef } = useArchiveIntro();

  return (
    <section
      ref={sectionRef}
      className={[styles.section, "page-width"].join(" ")}
      aria-labelledby="home-heading"
    >
      <div className={styles.panel}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>
            <span /> SOUND ARCHIVE / VOL. 001
          </span>
          <h1 id="home-heading" ref={titleRef} aria-label="Lost Files Library">
            <span
              ref={firstLineRef}
              aria-hidden="true"
              className={styles.titleLine}
            >
              Lost Files
            </span>
            <br />
            <span ref={secondLineRef} aria-hidden="true">
              Library
            </span>
          </h1>
          <p>
            A home for original beats, compositions, and sound packs. Discover
            independent producers, find your sound, and make something of your
            own.
          </p>
          <div className={styles.actions}>
            <Button asChild>
              <Link href="/beats">
                Browse Beats <ArrowUpRight />
              </Link>
            </Button>
            <Link href="/packs" className={styles.link}>
              Explore sound packs <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className={styles.edition}>
            <Image
              className={styles.brandStamp}
              src="/brand/lost-files-mark.webp"
              alt="Lost Files logo"
              width={64}
              height={64}
            />
            <div className={styles.stampText}>
              <span>LOST FILES / ORIGINALS</span>
              <span>INDEPENDENT AUDIO ARCHIVE</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
