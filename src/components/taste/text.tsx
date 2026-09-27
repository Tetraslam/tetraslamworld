import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import type { TasteMedia } from "../../../shared/taste";
import { IntentLink } from "../intent-link";

const MathBlock = dynamic(() => import("./math-block"), {
  loading: () => <span>…</span>,
});
export function TasteProse({ text }: { text: string }) {
  return (
    <div className="taste-prose">
      <ReactMarkdown
        components={{
          a: ({ href, children }) =>
            href?.startsWith("/") && !href.startsWith("//") ? (
              <IntentLink href={href}>{children}</IntentLink>
            ) : (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
export function TextArtwork({
  asset,
  preview = false,
}: {
  asset: TasteMedia;
  preview?: boolean;
}) {
  if (asset.format === "math") return <MathBlock text={asset.text ?? ""} />;
  if (asset.format === "code")
    return (
      <pre className="taste-code">
        <code>{preview ? asset.text?.slice(0, 500) : asset.text}</code>
      </pre>
    );
  if (preview)
    return (
      <blockquote className="taste-text-excerpt">
        {asset.text
          ?.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
          .replace(/[#*_`]/g, "")
          .slice(0, 500)}
      </blockquote>
    );
  return <TasteProse text={asset.text ?? ""} />;
}
export function imageUnoptimized(url: string) {
  try {
    const host = new URL(url).hostname;
    return (
      !(host.endsWith(".convex.cloud") || host.endsWith(".convex.site")) ||
      /\.(gif|svg)(?:\?|$)/i.test(url)
    );
  } catch {
    return true;
  }
}
