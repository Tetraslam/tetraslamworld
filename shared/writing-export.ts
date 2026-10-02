import { decodeBlock, mediaUrl, type WritingBlock } from "./writing";

const text = (value: unknown) => (typeof value === "string" ? value : "");
function url(value: unknown, base: string) {
  const src = mediaUrl(text(value));
  if (src.startsWith("/") && !src.startsWith("//")) return base + src;
  return /^(https?:|mailto:|#)/.test(src) ? src : "";
}
function blockMarkdown(block: WritingBlock, base: string): string {
  const caption = text(block.caption),
    credit = text(block.credit);
  const note = [
    caption,
    credit
      ? `credit: ${credit}${block.creditUrl ? ` (${url(block.creditUrl, base)})` : ""}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  switch (block.type) {
    case "image":
      return `![${text(block.alt).replaceAll("]", "\\]")}](${url(block.src, base)})${note ? `\n\n${note}` : ""}`;
    case "gallery":
      return `${(Array.isArray(block.items) ? block.items : []).map((item) => blockMarkdown({ ...item, type: "image" }, base)).join("\n\n")}\n\n${note}`;
    case "audio":
    case "video":
      return `${block.poster ? `![${text(block.alt)}](${url(block.poster, base)})\n\n` : ""}[${block.type === "audio" ? "Listen" : "Watch"}](${url(block.src, base)})\n\n${note}${block.transcript ? `\n\n${text(block.transcript)}` : ""}`;
    case "reference":
      return `[${text(block.label) || "related entry"}](${url(block.href, base)})${block.description ? `\n\n${text(block.description)}` : ""}`;
    case "interactive":
      return `${text(block.fallback) || "Interactive visualization; open the original post to explore it."}${note ? `\n\n${note}` : ""}`;
    default:
      return (
        text(block.fallback) ||
        "[unsupported block preserved in the source document]"
      );
  }
}
export function portableMarkdown(
  body: string,
  base = "https://www.tetraslam.world",
) {
  return body
    .replace(/^```writing\r?\n([\s\S]*?)\r?\n```/gm, (_match, raw) => {
      const block = decodeBlock(raw);
      return block ? blockMarkdown(block, base) : raw;
    })
    .replace(/writing-asset:([a-f0-9]{64})/g, `${base}/api/writing/media/$1`);
}
export const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
