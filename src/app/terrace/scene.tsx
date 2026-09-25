"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./terrace.module.css";

// Coordinates belong to the 1536 × 1024 painting. Keep moving water clear of
// the bridge, moored boats, people, and the unfinished paper edge.
export function TerraceScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const elapsed = useRef(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    if (paused || reducedMotion) {
      context.clearRect(0, 0, 1536, 1024);
      return;
    }

    const painting = new window.Image();
    let disposed = false;
    let frame = 0;
    let previous = 0;
    let visible = true;
    const water = new Path2D(
      "M 836 599 L 903 573 L 999 581 L 1051 620 L 1067 676 L 1093 735 L 1115 775 L 1147 831 L 1169 884 L 1202 936 L 1224 961 L 1016 957 L 1001 930 L 995 896 L 1003 866 L 984 811 L 961 789 L 954 748 L 928 728 L 923 704 L 855 697 L 842 654 Z",
    );

    const draw = (now: number) => {
      if (disposed || !visible || document.hidden) return;
      frame = requestAnimationFrame(draw);
      if (now - previous < 1000 / 24) return;
      const delta = previous ? Math.min((now - previous) / 1000, 0.1) : 0;
      previous = now;
      elapsed.current += delta;
      const time = elapsed.current;
      context.clearRect(0, 0, 1536, 1024);
      context.save();
      context.clip(water);
      // Move the actual painted reflections, rather than laying a generic
      // water effect over them. Displacement diminishes toward the bridge.
      for (let y = 570; y < 965; y += 2) {
        const depth = (y - 570) / 395;
        const shift =
          Math.sin(y * 0.075 + time * 0.9) * depth * 1.8 +
          Math.sin(y * 0.031 - time * 0.63) * depth;
        context.drawImage(painting, 830, y, 420, 2, 830 + shift, y, 420, 2);
      }
      context.restore();

      // A small flock crosses the distant sky, with a long quiet interval.
      const passage = time % 137;
      if (passage < 48) {
        context.strokeStyle = "rgba(96, 104, 102, .52)";
        context.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const x = 570 + passage * 8 + i * 21;
          const y = 84 + i * 12 + Math.sin(time * 0.3 + i) * 6;
          const wing = Math.sin(time * 3 + i) * 2;
          context.globalAlpha = Math.min(1, passage / 3, (48 - passage) / 4);
          context.beginPath();
          context.moveTo(x - 4, y - wing);
          context.quadraticCurveTo(x - 2, y - 2, x, y);
          context.quadraticCurveTo(x + 2, y - 2, x + 4, y - wing);
          context.stroke();
        }
        context.globalAlpha = 1;
      }
    };

    let loaded = false;
    const resume = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      if (loaded && !disposed && visible && !document.hidden) {
        frame = requestAnimationFrame(draw);
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      resume();
    });
    observer.observe(canvas);
    document.addEventListener("visibilitychange", resume);
    painting.onload = () => {
      loaded = true;
      resume();
    };
    painting.src = "/terrace.webp";
    return () => {
      disposed = true;
      painting.onload = null;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", resume);
    };
  }, [paused, reducedMotion]);

  return (
    <div className={styles.scene}>
      <Image
        src="/terrace.webp"
        alt="From a shaded terrace, a sleeping ginger cat overlooks a canal-side plaza. People make things at communal tables, garden robots tend flowers, and a tram passes cream and terracotta art deco buildings. Beyond the harbour are solar-covered hills and a distant spaceport."
        width={1536}
        height={1024}
        preload
        unoptimized
        className={styles.painting}
      />
      <canvas
        tabIndex={-1}
        ref={canvasRef}
        width={1536}
        height={1024}
        className={styles.canvas}
        aria-hidden="true"
      />
      {!reducedMotion && (
        <button
          type="button"
          className={styles.controls}
          onClick={() => setPaused(!paused)}
          aria-pressed={paused}
        >
          {paused ? "resume motion" : "pause motion"}
        </button>
      )}
    </div>
  );
}
