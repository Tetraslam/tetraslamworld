import {
  categoryLabel,
  type TasteRecord,
  tasteCategories,
  tasteKey,
  tasteMedia,
} from "./taste";

export function tasteMarkdown(item: TasteRecord) {
  let out = `# ${item.title}\n\n`;
  if (item.observation) out += `${item.observation}\n\n`;
  if (item.scope === "detail" && item.context)
    out += `Detail of: ${item.context}\n\n`;
  if (item.creator || item.year)
    out += `${[item.creator, item.year].filter(Boolean).join(" · ")}\n\n`;
  out += `Entry: https://tetraslam.world/taste/${encodeURIComponent(tasteKey(item))}\n\n`;
  if (item.url) out += `Source: ${item.url}\n\n`;
  for (const source of item.sources ?? [])
    out += `- [${source.label}](${source.url})\n`;
  if (tasteCategories(item).length)
    out += `\nCategories: ${tasteCategories(item).map(categoryLabel).join(", ")}\n`;
  if (item.qualities?.length)
    out += `Qualities: ${item.qualities.join(", ")}\n`;
  if (item.content) out += `\n${item.content}\n`;
  if (item.designNotes) out += `\n## What I notice\n\n${item.designNotes}\n`;
  for (const asset of tasteMedia(item)) {
    out += `\n## ${asset.alt || asset.kind}\n\n`;
    if (asset.kind === "image")
      out += `![${asset.alt || item.title}](${asset.url})\n`;
    else if (asset.kind === "text")
      out +=
        asset.format === "code"
          ? `\n\`\`\`\n${asset.text}\n\`\`\`\n`
          : asset.format === "math"
            ? `\n$$\n${asset.text}\n$$\n`
            : `${asset.text}\n`;
    else out += `${asset.kind}: ${asset.url}\n`;
    if (asset.poster) out += `Poster: ${asset.poster}\n`;
    if (asset.startSeconds !== undefined || asset.endSeconds !== undefined)
      out += `Passage: ${asset.startSeconds ?? 0}s${asset.endSeconds !== undefined ? `–${asset.endSeconds}s` : ""}\n`;
    if (asset.caption) out += `\n${asset.caption}\n`;
    if (asset.transcript) out += `\n### Transcript\n\n${asset.transcript}\n`;
    if (asset.captionsUrl) out += `\nCaptions: ${asset.captionsUrl}\n`;
    if (asset.credit)
      out += `\nCredit: ${asset.credit}${asset.creditUrl ? ` (${asset.creditUrl})` : ""}\n`;
  }
  return out;
}
