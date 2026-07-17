"use client";

import { useEffect, useRef, useState } from "react";

/**
 * iPod-style marquee for overflowing text: scrolls only when it doesn't fit.
 */
export function MarqueeText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [textWidth, setTextWidth] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: need to recheck on text change
  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const scrollWidth = textRef.current.scrollWidth;
        setIsOverflowing(scrollWidth > containerWidth);
        setTextWidth(scrollWidth);
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [text]);

  // Slower for longer text
  const duration = Math.max(8, textWidth / 20);

  return (
    <div ref={containerRef} className={`overflow-hidden ${className || ""}`}>
      <span
        ref={textRef}
        className={`inline-block whitespace-nowrap ${isOverflowing ? "animate-marquee" : ""}`}
        style={
          isOverflowing
            ? {
                animationDuration: `${duration}s`,
                paddingRight: "2rem",
              }
            : undefined
        }
      >
        {text}
        {isOverflowing && (
          <span className="pl-8" aria-hidden="true">
            {text}
          </span>
        )}
      </span>
    </div>
  );
}
