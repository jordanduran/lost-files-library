"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";
import land from "@/data/globe-land.json";
import { CITIES } from "@/data/producer-cities";
const RAD = Math.PI / 180;
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

export function ProducerGlobe({ activeCity, onSelect }: { activeCity: string | null; onSelect: (city: string) => void }) {
  const active = useRef(activeCity);
  const select = useRef(onSelect);
  const target = useRef<{lon: number; lat: number} | null>(null);
  const redraw = useRef<() => void>(() => {});
  const pitch = useRef(18 * RAD);
  useEffect(() => {
    active.current = activeCity;
    const city = CITIES.find(city => city.name === activeCity);
    target.current = city ? {lon: city.lon * RAD, lat: city.lat * RAD} : null;
    redraw.current();
  }, [activeCity]);
  useEffect(() => {select.current = onSelect;}, [onSelect]);
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
    let dragging = false;
    let moved = false;
    let lastX = 0, lastY = 0;
    let hitPoints: {city: string; x: number; y: number; left: number; top: number; width: number}[] = [];

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      hitPoints = [];
      if (reducedMotion && target.current) { rotation.current = target.current.lon; pitch.current = target.current.lat; }
      const configuredInk = getComputedStyle(canvas!)
        .getPropertyValue("--globe-ink")
        .trim();
      // Styles may briefly be absent during hydration or a hot stylesheet update.
      const ink = CSS.supports("color", `rgba(${configuredInk}, 1)`)
        ? configuredInk
        : "195, 194, 182";
      const configuredAccent = getComputedStyle(canvas!)
        .getPropertyValue("--accent")
        .trim();
      const accent = CSS.supports("color", configuredAccent) ? configuredAccent : "#c5a66c";
      const tone = (alpha: number) => `rgba(${ink}, ${alpha})`;
      const radius = Math.min(width * 0.35, height * 0.40);
      const cx = width / 2;
      const cy = height / 2;
      const sin = Math.sin(rotation.current);
      const cos = Math.cos(rotation.current);
      const tilt = pitch.current;
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
        const selected = city.name === active.current;
        if (selected) {
          const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 0.25);
          halo.addColorStop(0, 'rgba(183,211,191,0.55)');
          halo.addColorStop(1, 'rgba(183,211,191,0)');
          ctx.fillStyle = halo;
          ctx.fillRect(p.x-radius*0.25,p.y-radius*0.25,radius*0.5,radius*0.5);
          ctx.strokeStyle = accent;
          ctx.beginPath(); ctx.arc(p.x,p.y,14,0,Math.PI*2); ctx.stroke();
        }
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
        hitPoints.push({city: city.name, x:p.x, y:p.y, left:labelX, top:labelY-12, width:labelWidth});
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
      if (!dragging && target.current) {
        const delta = Math.atan2(Math.sin(target.current.lon-rotation.current), Math.cos(target.current.lon-rotation.current));
        const ease = 1 - Math.exp(-Math.min(time - (previous || time), 50) / 150);
        rotation.current += delta * ease;
        pitch.current += (target.current.lat-pitch.current) * ease;
      } else if (previous && !dragging && !reducedMotion) rotation.current += Math.min(time-previous,50)*0.000075;
      previous = time;
      draw();
      frame = requestAnimationFrame(animate);
    }
    function syncAnimation() {
      cancelAnimationFrame(frame);
      previous = 0;
      if (!reducedMotion && visible && !document.hidden)
        frame = requestAnimationFrame(animate);
      else draw();
    }
    redraw.current = draw;
    function down(event: PointerEvent) {
      if (event.button !== 0) return;
      dragging = true; moved = false; lastX = event.clientX; lastY = event.clientY;
      canvas!.setPointerCapture(event.pointerId);
    }
    function move(event: PointerEvent) {
      if (!dragging) return;
      const dx = event.clientX-lastX, dy = event.clientY-lastY;
      if (Math.abs(dx)+Math.abs(dy) > 2) moved = true;
      if (moved) target.current = null;
      rotation.current -= dx * 0.007;
      pitch.current = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch.current+dy*0.007));
      lastX = event.clientX; lastY = event.clientY; draw();
    }
    function up(event: PointerEvent) {
      if (!dragging) return;
      dragging = false;
      if (!moved) {
        const rect = canvas!.getBoundingClientRect();
        const x=event.clientX-rect.left, y=event.clientY-rect.top;
        const hit=hitPoints.find(p => Math.hypot(p.x-x,p.y-y)<16 || (x>=p.left && x<=p.left+p.width && y>=p.top && y<=p.top+18));
        if(hit) select.current(hit.city);
      }
      if(canvas!.hasPointerCapture(event.pointerId)) canvas!.releasePointerCapture(event.pointerId);
    }
    function cancel() { dragging = false; }
    function key(event: KeyboardEvent) {
      if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
      event.preventDefault(); target.current=null;
      rotation.current += event.key==='ArrowLeft' ? -0.15 : event.key==='ArrowRight' ? 0.15 : 0;
      pitch.current=Math.max(-Math.PI/2,Math.min(Math.PI/2,pitch.current+(event.key==='ArrowUp'?0.15:event.key==='ArrowDown'?-0.15:0)));
      draw();
    }
    canvas.addEventListener('pointerdown',down);
    canvas.addEventListener('pointermove',move);
    canvas.addEventListener('pointerup',up);
    canvas.addEventListener('pointercancel',cancel);
    canvas.addEventListener('keydown',key);
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
      redraw.current = () => {};
      canvas.removeEventListener('pointerdown',down);
      canvas.removeEventListener('pointermove',move);
      canvas.removeEventListener('pointerup',up);
      canvas.removeEventListener('pointercancel',cancel);
      canvas.removeEventListener('keydown',key);
      resize.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", syncAnimation);
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="producer-globe" tabIndex={0} role="img" aria-label="Interactive producer globe. Drag or use arrow keys to rotate. Select cities using the buttons below." />;
}
