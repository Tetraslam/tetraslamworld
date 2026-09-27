"use client";
import katex from "katex";
import { useMemo } from "react";
import "katex/dist/katex.min.css";

export default function MathBlock({ text }: { text: string }) {
  const html = useMemo(
    () =>
      katex.renderToString(text, {
        displayMode: true,
        throwOnError: false,
        trust: false,
        maxExpand: 1000,
        maxSize: 10,
        output: "htmlAndMathml",
        errorColor: "var(--destructive)",
      }),
    [text],
  );
  return (
    <div
      className="taste-math"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: KaTeX escapes input with trust disabled and bounded expansion.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
