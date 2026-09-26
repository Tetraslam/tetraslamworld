"use client";

import { useEffect, useRef } from "react";
import { REDUCED_MOTION, SETTLE_EASING } from "@/lib/motion";
import { Markdown } from "./markdown";

function excerpt(content: string) {
  const plain = content
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^[\s]*[#>*+-]+\s*/gm, "")
    .replace(/[`*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const long =
    plain.length > 280 ||
    content.split("\n").filter((line) => line.trim()).length > 6;
  const cut = plain.slice(0, 260);
  return {
    long,
    text: plain.length > 260 ? `${cut.replace(/\s+\S*$/, "")}…` : plain,
  };
}

export function ExpandableMarkdown({ content }: { content: string }) {
  const details = useRef<HTMLDetailsElement>(null);
  const animation = useRef<Animation | null>(null);
  const preview = excerpt(content);
  useEffect(() => {
    const preference = window.matchMedia(REDUCED_MOTION);
    const cancel = () => animation.current?.cancel();
    preference.addEventListener("change", cancel);
    return () => {
      cancel();
      preference.removeEventListener("change", cancel);
    };
  }, []);
  if (!preview.long) return <Markdown content={content} />;
  return (
    <details ref={details} className="expandable-copy">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Native summary generates clicks for Enter and Space. */}
      <summary
        onClick={(event) => {
          const element = details.current;
          if (!element) return;
          event.preventDefault();
          const from = element.getBoundingClientRect().height;
          animation.current?.cancel();
          element.open = !element.open;
          const to = element.getBoundingClientRect().height;
          if (!window.matchMedia(REDUCED_MOTION).matches) {
            animation.current = element.animate(
              [{ height: `${from}px` }, { height: `${to}px` }],
              { duration: 220, easing: SETTLE_EASING },
            );
          }
        }}
      >
        <span className="copy-excerpt">{preview.text}</span>
        <span className="copy-more">read more</span>
        <span className="copy-less">show less</span>
      </summary>
      <div className="copy-full">
        <Markdown content={content} />
      </div>
    </details>
  );
}
