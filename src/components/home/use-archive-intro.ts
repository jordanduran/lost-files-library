"use client";

import { useLayoutEffect, useRef } from "react";

let introSeenThisLoad = false;
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%/+<>[]";

export function useArchiveIntro() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const firstLineRef = useRef<HTMLSpanElement>(null);
  const secondLineRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const title = titleRef.current;
    const first = firstLineRef.current;
    const second = secondLineRef.current;
    if (!section || !title || !first || !second) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const replay =
      new URLSearchParams(window.location.search).get("intro") === "1";
    if (replay) window.scrollTo({ top: 0, behavior: "instant" });
    if (
      (motion.matches && !replay) ||
      introSeenThisLoad ||
      window.scrollY > 60 ||
      window.location.hash
    )
      return;

    let frame = 0;
    let animation: Animation | undefined;
    let cancelled = false;
    let finished = false;
    const restore = () => {
      first.textContent = "Lost Files";
      second.textContent = "Library";
      title.style.transform = "";
      delete section.dataset.intro;
    };
    const finish = () => {
      if (finished) return;
      finished = true;
      cancelled = true;
      cancelAnimationFrame(frame);
      animation?.cancel();
      restore();
      introSeenThisLoad = true;
    };
    section.dataset.intro = "waiting";
    const fontTimeout = window.setTimeout(start, 500);
    let started = false;
    void document.fonts.ready.then(start);

    function start() {
      if (cancelled || started || !section || !title || !first || !second)
        return;
      started = true;
      clearTimeout(fontTimeout);
      const bounds = section.getBoundingClientRect();
      const heading = title.getBoundingClientRect();
      const x =
        bounds.left + bounds.width / 2 - (heading.left + heading.width / 2);
      const y =
        bounds.top +
        Math.min(bounds.height, 570) / 2 -
        (heading.top + heading.height / 2);
      const transform = `translate(${x}px, ${y}px)`;
      title.style.transform = transform;
      section.dataset.intro = "scrambling";
      const began = performance.now();
      let lastTick = -1;
      function tick(now: number) {
        if (cancelled || !section || !title || !first || !second) return;
        const elapsed = now - began;
        const tickIndex = Math.floor(elapsed / 65);
        if (tickIndex !== lastTick) {
          lastTick = tickIndex;
          const resolved = Math.floor(Math.max(0, elapsed - 180) / 65);
          let index = 0;
          for (const [element, text] of [
            [first, "Lost Files"],
            [second, "Library"],
          ] as const) {
            element.textContent = [...text]
              .map((character) => {
                if (character === " ") return character;
                const position = index++;
                return position < resolved
                  ? character
                  : GLYPHS[(tickIndex * 7 + position * 13) % GLYPHS.length];
              })
              .join("");
          }
        }
        if (elapsed < 1550) {
          frame = requestAnimationFrame(tick);
          return;
        }
        first.textContent = "Lost Files";
        second.textContent = "Library";
        section.dataset.intro = "settling";
        animation = title.animate(
          [{ transform }, { transform: "translate(0, 0)" }],
          {
            duration: 850,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "forwards",
          },
        );
        animation.onfinish = finish;
      }
      frame = requestAnimationFrame(tick);
    }
    const onScroll = () => {
      if (window.scrollY > 60) finish();
    };
    section.addEventListener("focusin", finish);
    section.addEventListener("pointerdown", finish);
    window.addEventListener("resize", finish);
    window.addEventListener("scroll", onScroll, { passive: true });
    motion.addEventListener("change", finish);
    return () => {
      cancelled = true;
      clearTimeout(fontTimeout);
      cancelAnimationFrame(frame);
      animation?.cancel();
      restore();
      section.removeEventListener("focusin", finish);
      section.removeEventListener("pointerdown", finish);
      window.removeEventListener("resize", finish);
      window.removeEventListener("scroll", onScroll);
      motion.removeEventListener("change", finish);
    };
  }, []);

  return { sectionRef, titleRef, firstLineRef, secondLineRef };
}
