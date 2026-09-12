"use client";

import { useEffect, useRef } from "react";
import styles from "./cursor-background.module.css";

export function CursorBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const media = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    let cursorX: number | null = null;
    let cursorY = 0;

    function updateReveal() {
      if (!canvas) return;
      canvas.style.opacity = media.matches && cursorX !== null ? "1" : "0";
      if (cursorX !== null) {
        canvas.style.setProperty("--cursor-x", `${cursorX}px`);
        canvas.style.setProperty("--cursor-y", `${cursorY}px`);
      }
    }

    function draw() {
      if (!canvas || !ctx) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const colors = getComputedStyle(canvas);
      ctx.strokeStyle = colors.getPropertyValue("--accent").trim();
      ctx.fillStyle = colors.getPropertyValue("--background").trim();
      ctx.lineWidth = 1;

      ctx.globalAlpha = 0.07;
      ctx.beginPath();
      for (let x = 0; x < width; x += 28) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
      }
      for (let y = 0; y < height; y += 28) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
      }
      ctx.stroke();

      // Repeated chip modules with routed traces, solder pads, and socket pins.
      for (let y = -100; y < height + 280; y += 280) {
        for (let x = -80; x < width + 360; x += 360) {
          ctx.globalAlpha = 0.28;
          ctx.fillRect(x, y, 92, 92);
          ctx.strokeRect(x, y, 92, 92);
          ctx.strokeRect(x + 9, y + 9, 74, 74);
          ctx.strokeRect(x + 22, y + 22, 48, 48);
          for (let pin = 0; pin < 8; pin++) {
            const offset = 12 + pin * 10;
            for (let side = 0; side < 4; side++) {
              ctx.save();
              ctx.translate(x + 46, y + 46);
              ctx.rotate((side * Math.PI) / 2);
              const start = offset - 46;
              const length = 24 + pin * 9;
              ctx.globalAlpha = 0.23;
              ctx.beginPath();
              ctx.moveTo(start, -46);
              ctx.lineTo(start, -46 - length);
              ctx.lineTo(start + 18, -64 - length);
              ctx.lineTo(start + 18, -82 - length);
              ctx.stroke();
              ctx.globalAlpha = 0.3;
              ctx.strokeRect(start - 2, -53, 4, 7);
              ctx.beginPath();
              ctx.arc(start + 18, -85 - length, 3, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }
          }
          ctx.globalAlpha = 0.16;
          for (let slot = 0; slot < 3; slot++) {
            ctx.strokeRect(x + 150, y + slot * 14, 104, 7);
          }
          for (let cap = 0; cap < 4; cap++) {
            ctx.beginPath();
            ctx.arc(x + 160 + cap * 25, y + 83, 7, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
      updateReveal();
    }

    function move(event: PointerEvent) {
      if (!media.matches || event.pointerType === "touch") return;
      cursorX = event.clientX;
      cursorY = event.clientY;
      updateReveal();
    }
    function reset() {
      cursorX = null;
      updateReveal();
    }
    draw();
    window.addEventListener("resize", draw);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("blur", reset);
    document.documentElement.addEventListener("pointerleave", reset);
    media.addEventListener("change", reset);
    return () => {
      window.removeEventListener("resize", draw);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("blur", reset);
      document.documentElement.removeEventListener("pointerleave", reset);
      media.removeEventListener("change", reset);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className={styles.background} aria-hidden="true" />
  );
}
