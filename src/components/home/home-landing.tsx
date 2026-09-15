"use client";

import { useEffect, useState } from "react";
import { ProducerHack } from "@/components/producers/producer-hack";
import { PackStorefront } from "@/components/packs/pack-storefront";
import type { Producer } from "@/types/producer";
import { homeIntroSeen, markHomeIntroSeen } from "@/lib/home-intro";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%/+<>[]";
const TITLE = "LOST FILES LIBRARY";

export function HomeLanding({
  producer,
  purchasedPackIds,
}: {
  producer: Producer;
  purchasedPackIds: string[];
}) {
  const [intro, setIntro] = useState(true);
  const [text, setText] = useState(TITLE);
  const [animateReveal, setAnimateReveal] = useState(false);

  useEffect(() => {
    if (
      homeIntroSeen() ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const reducedFrame = requestAnimationFrame(() => setIntro(false));
      return () => cancelAnimationFrame(reducedFrame);
    }
    const started = performance.now();
    let frame = 0;
    let finishTimer = 0;
    const tick = (now: number) => {
      setAnimateReveal(true);
      const elapsed = now - started;
      const resolved = Math.floor(Math.max(0, elapsed - 180) / 58);
      setText(
        [...TITLE]
          .map((character, index) => {
            if (character === " ") return character;
            return index < resolved
              ? character
              : GLYPHS[
                  (Math.floor(elapsed / 58) * 7 + index * 13) % GLYPHS.length
                ];
          })
          .join(""),
      );
      if (elapsed < 1450) frame = requestAnimationFrame(tick);
      else {
        setText(TITLE);
        finishTimer = window.setTimeout(() => {
          markHomeIntroSeen();
          setIntro(false);
        }, 520);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(finishTimer);
    };
  }, []);

  return (
    <>
      <div
        className="home-landing"
        data-ready={!intro}
        data-animate={animateReveal}
        aria-hidden={intro}
      >
        <ProducerHack producer={producer} purchasedPackIds={purchasedPackIds} />
        <PackStorefront purchasedPackIds={purchasedPackIds} />
      </div>
      {intro && (
        <div
          className="matrix-intro"
          role="status"
          aria-label="Loading Lost Files Library"
        >
          <div className="matrix-rain" aria-hidden="true" />
          <p>INITIALIZING ARCHIVE...</p>
          <h1>{text}</h1>
          <span>DECRYPTING PRODUCER FILES / ACCESS PENDING</span>
        </div>
      )}
    </>
  );
}
