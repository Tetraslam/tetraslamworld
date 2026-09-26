"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { REDUCED_MOTION, SETTLE_EASING } from "@/lib/motion";

type Point = { x: number; y: number };

function position(element: HTMLElement, root: HTMLElement): Point {
  let x = 0,
    y = 0;
  let node: HTMLElement | null = element;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

/** Measure layout coordinates, not entrance transforms. Only retained keyed items move. */
export function useListMotion() {
  const root = useRef<HTMLDivElement>(null);
  const positions = useRef(new Map<string, Point>());
  const animations = useRef(new Map<HTMLElement, Animation>());

  useLayoutEffect(() => {
    const container = root.current;
    if (!container) return;
    const reduced = window.matchMedia(REDUCED_MOTION).matches;
    const next = new Map<string, Point>();
    for (const element of container.querySelectorAll<HTMLElement>(
      "[data-motion-key]",
    )) {
      const key = element.dataset.motionKey;
      if (!key) continue;
      const target = position(element, container);
      const old = positions.current.get(key);
      const translation = getComputedStyle(element)
        .translate.split(" ")
        .map((value) => Number.parseFloat(value) || 0);
      animations.current.get(element)?.cancel();
      animations.current.delete(element);
      next.set(key, target);
      if (!old || reduced) continue;
      const dx = old.x + translation[0] - target.x;
      const dy = old.y + (translation[1] ?? 0) - target.y;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      const distant = Math.hypot(dx, dy) > 120;
      const animation = element.animate(
        distant
          ? [
              {
                translate: `${Math.sign(dx) * 8}px ${Math.sign(dy) * 12}px`,
                opacity: 0.4,
              },
              { translate: "0px 0px", opacity: 1 },
            ]
          : [{ translate: `${dx}px ${dy}px` }, { translate: "0px 0px" }],
        { duration: 220, easing: SETTLE_EASING },
      );
      animations.current.set(element, animation);
      animation.onfinish = () => {
        if (animations.current.get(element) === animation)
          animations.current.delete(element);
      };
    }
    for (const [element, animation] of animations.current) {
      if (!container.contains(element)) {
        animation.cancel();
        animations.current.delete(element);
      }
    }
    positions.current = next;
  });

  useEffect(() => {
    const preference = window.matchMedia(REDUCED_MOTION);
    const reset = () => {
      for (const animation of animations.current.values()) animation.cancel();
      animations.current.clear();
      positions.current.clear();
    };
    preference.addEventListener("change", reset);
    window.addEventListener("resize", reset);
    return () => {
      reset();
      preference.removeEventListener("change", reset);
      window.removeEventListener("resize", reset);
    };
  }, []);
  return root;
}
