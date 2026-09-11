"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import land from "@/data/globe-land.json";
import styles from "./blueprint-globe.module.css";
import { useArchiveIntro } from "./use-archive-intro";

const RAD = Math.PI / 180;
const CITIES = [
  { name: "LOS ANGELES", lat: 34.05, lon: -118.24 },
  { name: "NEW YORK", lat: 40.71, lon: -74.01 },
  { name: "LONDON", lat: 51.51, lon: -0.13 },
  { name: "LAGOS", lat: 6.52, lon: 3.38 },
  { name: "SÃO PAULO", lat: -23.55, lon: -46.63 },
  { name: "JOHANNESBURG", lat: -26.2, lon: 28.05 },
  { name: "MUMBAI", lat: 19.08, lon: 72.88 },
  { name: "TOKYO", lat: 35.68, lon: 139.69 },
  { name: "SYDNEY", lat: -33.87, lon: 151.21 },
];
type Vector = [number, number, number];
function vector(lon: number, lat: number): Vector {
  return [
    Math.cos(lat * RAD) * Math.sin(lon * RAD),
    Math.sin(lat * RAD),
    Math.cos(lat * RAD) * Math.cos(lon * RAD),
  ];
}
// Public-domain Natural Earth 1:110m land polygons, rounded to 0.01 degrees.
// https://www.naturalearthdata.com/downloads/110m-physical-vectors/110m-land/
const COASTLINES = land.map((ring) =>
  ring.map(([lon, lat]) => vector(lon, lat)),
);
const GRID = [
  ...Array.from({ length: 11 }, (_, i) =>
    Array.from({ length: 181 }, (_, j) => vector(j * 2 - 180, (i - 5) * 15)),
  ),
  ...Array.from({ length: 12 }, (_, i) =>
    Array.from({ length: 181 }, (_, j) => vector(i * 30, j - 90)),
  ),
];
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

export function BlueprintGlobe() {
  const { sectionRef, titleRef, firstLineRef, secondLineRef } =
    useArchiveIntro();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotation = useRef(-35 * RAD);
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let frame = 0;
    let previous = 0;
    let visible = false;
    let width = 760;
    let height = 520;
    const moving = !reducedMotion;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const ink = getComputedStyle(canvas!)
        .getPropertyValue("--globe-ink")
        .trim();
      const accent = getComputedStyle(canvas!)
        .getPropertyValue("--accent")
        .trim();
      const tone = (alpha: number) => `rgba(${ink}, ${alpha})`;
      const radius = Math.min(width * 0.32, height * 0.39);
      const cx = width / 2;
      const cy = height / 2;
      const sin = Math.sin(rotation.current);
      const cos = Math.cos(rotation.current);
      const tilt = 18 * RAD;
      function project([x, y, z]: Vector) {
        const depth = x * sin + z * cos;
        return {
          x: cx + (x * cos - z * sin) * radius,
          y: cy - (y * Math.cos(tilt) - depth * Math.sin(tilt)) * radius,
          z: y * Math.sin(tilt) + depth * Math.cos(tilt),
        };
      }
      const glow = ctx.createRadialGradient(
        cx,
        cy,
        radius * 0.2,
        cx,
        cy,
        radius * 1.2,
      );
      glow.addColorStop(0, tone(0.07));
      glow.addColorStop(0.8, tone(0.035));
      glow.addColorStop(1, tone(0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
      function lines(paths: Vector[][], color: string, front: boolean) {
        if (!ctx) return;
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        for (const path of paths) {
          let penDown = false;
          for (const point of path) {
            const p = project(point);
            if (p.z >= 0 !== front) {
              penDown = false;
              continue;
            }
            if (penDown) ctx.lineTo(p.x, p.y);
            else ctx.moveTo(p.x, p.y);
            penDown = true;
          }
        }
        ctx.stroke();
      }
      lines(GRID, tone(0.09), false);
      lines(GRID, tone(0.28), true);
      lines(COASTLINES, tone(0.82), true);
      ctx.strokeStyle = tone(0.42);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = tone(0.16);
      ctx.setLineDash([2, 7]);
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const labels: { x: number; y: number; width: number }[] = [];
      ctx.font = `${width < 500 ? 9 : 10}px monospace`;
      for (const city of CITIES) {
        const p = project(vector(city.lon, city.lat));
        if (p.z < 0.15) continue;
        ctx.globalAlpha = Math.min(1, (p.z - 0.15) * 5);
        const right = p.x >= cx;
        const labelWidth = ctx.measureText(city.name).width;
        const endX = Math.max(
          labelWidth + 12,
          Math.min(width - labelWidth - 12, p.x + (right ? 23 : -23)),
        );
        let labelY = p.y - 17;
        const labelX = right ? endX + 5 : endX - labelWidth - 5;
        for (let attempt = 0; attempt < CITIES.length; attempt++) {
          if (
            !labels.some(
              (label) =>
                Math.abs(label.y - labelY) < 16 &&
                labelX < label.x + label.width + 8 &&
                labelX + labelWidth + 8 > label.x,
            )
          )
            break;
          labelY += 18;
        }
        labels.push({ x: labelX, y: labelY, width: labelWidth });
        ctx.strokeStyle = tone(0.5);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(endX, labelY + 4);
        ctx.lineTo(right ? endX + 12 : endX - 12, labelY + 4);
        ctx.stroke();
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = tone(0.9);
        ctx.fillText(city.name, labelX, labelY);
      }
      ctx.globalAlpha = 1;
    }
    function animate(time: number) {
      if (previous)
        rotation.current += Math.min(time - previous, 50) * 0.000075;
      previous = time;
      draw();
      frame = requestAnimationFrame(animate);
    }
    function syncAnimation() {
      cancelAnimationFrame(frame);
      previous = 0;
      if (moving && visible && !document.hidden)
        frame = requestAnimationFrame(animate);
      else draw();
    }
    const resize = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    });
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncAnimation();
    });
    resize.observe(canvas);
    intersection.observe(canvas);
    document.addEventListener("visibilitychange", syncAnimation);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", syncAnimation);
    };
  }, [reducedMotion]);

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
        <div className={styles.visual}>
          <div className={styles.readout}>
            <span>WORLD ATLAS / GLOBAL FREQUENCIES</span>
            <span>VOL. 001</span>
          </div>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            role="img"
            aria-label={
              "Blueprint earth with labeled cities: " +
              CITIES.map((city) => city.name).join(", ") +
              "."
            }
          />
          <div className={styles.caption}>
            <span>INDEPENDENT SOUND. WORLDWIDE.</span>
            <a href="/?intro=1" aria-label="Replay animated intro">
              REPLAY INTRO ↗
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
