"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { REDUCED_MOTION, REGION_DURATION } from "@/lib/motion";

export function RevealRegion({
  open,
  id,
  children,
}: {
  open: boolean;
  id: string;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);
  useEffect(() => {
    if (!mounted) return;
    const preference = window.matchMedia(REDUCED_MOTION);
    let frame = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      if (!preference.matches) return;
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      setVisible(open);
      if (!open) setMounted(false);
    };
    if (open) {
      // Resolve the collapsed box before transitioning to the mounted content's height.
      root.current?.getBoundingClientRect();
      frame = requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      if (preference.matches) setMounted(false);
      else timer = setTimeout(() => setMounted(false), REGION_DURATION);
    }
    preference.addEventListener("change", finish);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      preference.removeEventListener("change", finish);
    };
  }, [open, mounted]);
  return (
    <div
      ref={root}
      id={id}
      className="reveal-region"
      data-open={visible}
      inert={!open}
      aria-hidden={!open}
    >
      <div className="reveal-region-inner">{mounted ? children : null}</div>
    </div>
  );
}
