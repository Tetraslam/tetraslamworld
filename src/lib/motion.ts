import type { CSSProperties } from "react";

export const SETTLE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
export const REGION_DURATION = 240;

export function entranceStyle(index: number): CSSProperties {
  return {
    "--enter-delay": `${Math.min(Math.max(index, 0), 6) * 32}ms`,
  } as CSSProperties;
}
