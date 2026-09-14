"use client";

import { useEffect, useState } from "react";
import { ProducerHack } from "@/components/producers/producer-hack";
import type { Producer } from "@/types/producer";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%/+<>[]";
const TITLE = "LOST FILES LIBRARY";

export function HomeLanding({ producer }: { producer: Producer }) {
  const [intro, setIntro] = useState(true);
  const [text, setText] = useState(TITLE);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const reducedFrame = requestAnimationFrame(() => setIntro(false));
      return () => cancelAnimationFrame(reducedFrame);
    }
    const started = performance.now();
    let frame = 0;
    let finishTimer = 0;
    const tick = (now: number) => {
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
        finishTimer = window.setTimeout(() => setIntro(false), 520);
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
      <div className="home-landing" data-ready={!intro} aria-hidden={intro}>
        <ProducerHack producer={producer} />
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
