"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { REDUCED_MOTION, SETTLE_EASING } from "@/lib/motion";
import { artworkSource } from "@/lib/theme-art";

export function ThemeArtwork() {
  const { resolvedTheme } = useTheme();
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const preference = window.matchMedia(REDUCED_MOTION);
    const image = new window.Image();
    let disposed = false;
    let motion: Animation | undefined;
    const cancel = () => motion?.cancel();
    image.src = artworkSource(
      resolvedTheme
        ? resolvedTheme === "dark"
        : document.documentElement.classList.contains("dark"),
      window.innerWidth,
      window.devicePixelRatio,
    );
    // CSS already chooses the right resource before hydration. Only soften an
    // uncached arrival; do not hide an image the browser has already painted.
    if (!image.complete)
      image.onload = () => {
        if (!disposed && !preference.matches)
          motion = root.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: 220,
            easing: SETTLE_EASING,
          });
      };
    preference.addEventListener("change", cancel);
    return () => {
      disposed = true;
      image.onload = null;
      cancel();
      preference.removeEventListener("change", cancel);
    };
  }, [resolvedTheme]);
  return (
    <div
      ref={root}
      className="home-painting home-art"
      role="img"
      aria-label="A terrace above a canal-side neighbourhood, with workshops, gardens, a sleeping cat, and solar-covered hills across the harbour."
    />
  );
}
