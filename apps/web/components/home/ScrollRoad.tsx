"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./scroll-road.css";

// A winding road that runs down the homepage behind the sections. It curves gently inside the
// right margin and, in the gap above the closing section, turns in to end just above the logo.
// A top-down chauffeur car follows the scroll along it and the gold centre line draws in behind it.
// Placement is measured from the real layout, so the road never runs through section content.

type Geometry = {
  w: number;
  h: number;
  d: string;
  roadW: number;
  end: { x: number; y: number };
};

const GOLD = "#d4b06a";

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function measure(main: HTMLElement): Geometry | null {
  const mainRect = main.getBoundingClientRect();
  const w = main.clientWidth;
  const h = main.scrollHeight;
  const wraps = Array.from(main.children)
    .filter((el) => el.tagName === "SECTION")
    .map((s) => s.querySelector<HTMLElement>(":scope > .wrap"))
    .filter((el): el is HTMLElement => !!el);
  if (wraps.length < 2 || w === 0) return null;

  const boxes = wraps.map((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      top: r.top - mainRect.top,
      bottom: r.bottom - mainRect.top,
      left: r.left - mainRect.left + parseFloat(cs.paddingLeft || "0"),
    };
  });

  const gutter = Math.max(12, Math.min(...boxes.map((b) => b.left)));
  const roadW = clamp(gutter * 0.42, 10, 44);
  // Centre line sways gently inside the right margin, never reaching the content edge.
  const inner = w - gutter + roadW / 2 + 6;
  const outer = w - roadW / 2 - 6;
  const xa = Math.min(inner, outer);
  const xb = Math.max(inner, outer);
  const f = (n: number) => n.toFixed(1);
  const last = boxes.length - 1;

  // Final approach: leave the margin in the gap above the closing section and stop above its logo.
  const zTop = boxes[last - 1].bottom;
  const zBot = boxes[last].top;
  const turnY = zTop + roadW * 0.6 + 10;
  const end = { x: w / 2, y: zBot - roadW * 0.9 };

  const period = clamp(w * 0.5, 420, 760);
  let x = xb;
  let y = 0;
  let d = `M${f(x)},${f(y)}`;
  let toInner = true;
  while (y < turnY) {
    const ny = Math.min(turnY, y + period / 2);
    const nx = ny === turnY ? xb : toInner ? xa : xb;
    const k = (ny - y) / 2;
    d += ` C${f(x)},${f(y + k)} ${f(nx)},${f(ny - k)} ${f(nx)},${f(ny)}`;
    x = nx;
    y = ny;
    toInner = !toInner;
  }
  const dy = end.y - y;
  d += ` C${f(x)},${f(y + dy * 0.78)} ${f(end.x)},${f(end.y - dy * 0.9)} ${f(end.x)},${f(end.y)}`;

  return { w, h, d, roadW, end };
}

export function ScrollRoad() {
  const svgRef = useRef<SVGSVGElement>(null);
  const roadRef = useRef<SVGPathElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const carRef = useRef<SVGGElement>(null);
  const [geo, setGeo] = useState<Geometry | null>(null);

  // Measure the page and keep the road in step with layout changes (fonts, images, resizes).
  useEffect(() => {
    const main = svgRef.current?.parentElement;
    if (!main) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastKey = "";
    const update = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const g = measure(main);
        const key = g ? `${g.w}|${g.h}|${g.d}` : "";
        if (key !== lastKey) {
          lastKey = key;
          setGeo(g);
        }
      }, 50);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(main);
    Array.from(main.children).forEach((c) => ro.observe(c));
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(timer);
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  // Drive the car along the road from the scroll position.
  useLayoutEffect(() => {
    const svg = svgRef.current;
    const road = roadRef.current;
    const trail = trailRef.current;
    const car = carRef.current;
    if (!geo || !svg || !road || !trail || !car) return;

    const total = road.getTotalLength();
    const step = 6;
    const ys: number[] = [];
    for (let l = 0; l <= total; l += step) ys.push(road.getPointAtLength(l).y);
    const carScale = Math.max(geo.roadW * 0.6, 10) / 22;

    const lengthAtY = (targetY: number) => {
      let lo = 0;
      let hi = ys.length - 1;
      if (targetY <= ys[0]) return 0;
      if (targetY >= ys[hi]) return total;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (ys[mid] < targetY) lo = mid;
        else hi = mid;
      }
      const t = (targetY - ys[lo]) / Math.max(0.001, ys[hi] - ys[lo]);
      return Math.min(total, (lo + t) * step);
    };

    const place = (len: number) => {
      const p = road.getPointAtLength(len);
      const a = road.getPointAtLength(Math.max(0, len - 1));
      const b = road.getPointAtLength(Math.min(total, len + 1));
      const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      car.setAttribute(
        "transform",
        `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${deg.toFixed(1)}) scale(${carScale.toFixed(3)})`,
      );
      trail.style.strokeDasharray = `${len.toFixed(1)} ${(total + 10).toFixed(1)}`;
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // No motion: the road is fully lit and the car is parked at its destination.
      place(total);
      return;
    }

    let current = -1;
    let target = 0;
    let raf = 0;
    const readTarget = () => {
      const top = svg.getBoundingClientRect().top;
      target = lengthAtY(window.innerHeight * 0.62 - top);
    };
    const tick = () => {
      if (current < 0) current = target;
      const diff = target - current;
      current = Math.abs(diff) < 0.5 ? target : current + diff * 0.14;
      place(current);
      raf = current === target ? 0 : requestAnimationFrame(tick);
    };
    const onScroll = () => {
      readTarget();
      if (current < 0) {
        current = target;
        place(current);
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [geo]);

  const rw = geo?.roadW ?? 0;
  return (
    <svg
      ref={svgRef}
      className="scroll-road"
      aria-hidden="true"
      focusable="false"
      width={geo?.w ?? 0}
      height={geo?.h ?? 0}
      viewBox={geo ? `0 0 ${geo.w} ${geo.h}` : undefined}
    >
      {geo && (
        <>
          <defs>
            <linearGradient id="sr-fade-in" x1="0" y1="0" x2="0" y2="180" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="1" stopColor="#fff" stopOpacity="1" />
            </linearGradient>
            <mask id="sr-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={geo.w} height={geo.h}>
              <rect x="0" y="0" width={geo.w} height={geo.h} fill="url(#sr-fade-in)" />
            </mask>
            <linearGradient id="sr-beam" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff1cc" stopOpacity=".55" />
              <stop offset=".35" stopColor="#ebd3a0" stopOpacity=".22" />
              <stop offset="1" stopColor="#ebd3a0" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="sr-body" x1="0" y1="-1" x2="0" y2="1">
              <stop offset="0" stopColor="#2c2c2c" />
              <stop offset=".5" stopColor="#151515" />
              <stop offset="1" stopColor="#050505" />
            </linearGradient>
            <radialGradient id="sr-glow">
              <stop offset="0" stopColor={GOLD} stopOpacity=".35" />
              <stop offset="1" stopColor={GOLD} stopOpacity="0" />
            </radialGradient>
          </defs>

          <g mask="url(#sr-mask)" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Shoulder, edge lines and asphalt */}
            <path d={geo.d} stroke="#000" strokeOpacity=".45" strokeWidth={rw + 16} />
            <path d={geo.d} stroke="#fff" strokeOpacity=".09" strokeWidth={rw + 2} />
            <path ref={roadRef} d={geo.d} stroke="#0b0b0b" strokeWidth={rw} />
            {/* Unlit centre dashes ahead of the car */}
            <path
              d={geo.d}
              stroke="#fff"
              strokeOpacity=".16"
              strokeWidth={Math.max(1, rw * 0.05)}
              strokeDasharray={`${(rw * 0.4).toFixed(1)} ${(rw * 0.55).toFixed(1)}`}
              strokeLinecap="butt"
            />
            {/* Gold line that draws in behind the car */}
            <path
              ref={trailRef}
              className="sr-trail"
              d={geo.d}
              stroke={GOLD}
              strokeOpacity=".85"
              strokeWidth={Math.max(1.2, rw * 0.06)}
              strokeDasharray="0 1000000"
            />
          </g>

          {/* Destination marker above the closing logo */}
          <g transform={`translate(${geo.end.x.toFixed(1)} ${geo.end.y.toFixed(1)})`}>
            <circle r={rw * 1.4} fill="url(#sr-glow)" />
            <circle className="sr-end-pulse" r={Math.max(4, rw * 0.22)} fill="none" stroke={GOLD} strokeWidth="1" />
            <circle r={Math.max(3, rw * 0.14)} fill={GOLD} />
          </g>

          {/* Top-down saloon, nose pointing along +x. Base size 44 x 22, scaled to the road. */}
          <g ref={carRef} className="sr-car" transform="translate(-999 -999)">
            <path d="M20,-6 L120,-30 L120,30 L20,6 Z" fill="url(#sr-beam)" />
            <ellipse cx="0" cy="0" rx="34" ry="20" fill="url(#sr-glow)" />
            <rect x="-23" y="-12" width="47" height="24" rx="7" fill="#000" opacity=".55" />
            <rect x="-22" y="-10.5" width="44" height="21" rx="6.5" fill="url(#sr-body)" stroke={GOLD} strokeOpacity=".45" strokeWidth=".7" />
            {/* mirrors */}
            <rect x="6" y="-12.5" width="3" height="2.4" rx="1" fill="#1a1a1a" />
            <rect x="6" y="10.1" width="3" height="2.4" rx="1" fill="#1a1a1a" />
            {/* windscreen, roof, rear window */}
            <path d="M4,-8 L11,-7 Q13,0 11,7 L4,8 Z" fill="#3a3a3a" opacity=".9" />
            <rect x="-11" y="-7.6" width="15" height="15.2" rx="2.5" fill="#0d0d0d" />
            <path d="M-11,-7.4 L-16,-6.4 Q-17.5,0 -16,6.4 L-11,7.4 Z" fill="#2e2e2e" opacity=".85" />
            <path d="M-9,-6.5 L2,-6.5" stroke="#fff" strokeOpacity=".12" strokeWidth=".8" />
            {/* bonnet crease */}
            <path d="M13,-4 Q19,0 13,4" fill="none" stroke="#fff" strokeOpacity=".1" strokeWidth=".7" />
            {/* headlights and tail lights */}
            <rect x="19.5" y="-8.5" width="2.6" height="4.2" rx="1.2" fill="#fff4cf" />
            <rect x="19.5" y="4.3" width="2.6" height="4.2" rx="1.2" fill="#fff4cf" />
            <rect x="-22.2" y="-8.5" width="2" height="4" rx="1" fill="#8a6a35" />
            <rect x="-22.2" y="4.5" width="2" height="4" rx="1" fill="#8a6a35" />
          </g>
        </>
      )}
    </svg>
  );
}
