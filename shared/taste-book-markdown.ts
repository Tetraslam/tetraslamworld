import type { Preview } from "./previews";
import type { TasteRecord } from "./taste";
import { type EntryIndex, join, type Picture } from "./taste-book";
import { tasteMarkdown } from "./taste-markdown";
import {
  type Direction,
  resolveHref,
  splitFrontmatter,
  TETRASTACK_URL,
  type Tetrastack,
  type TetrastackFiles,
} from "./tetrastack";

/**
 * Markdown versions of the taste page, for agents. They stay close to
 * tetrastack's own files: the same text, with links that work from
 * tetraslam.world, plus the images the page found for each source.
 */

const SITE = "https://tetraslam.world";

function absolute(href: string, from: string) {
  const target = resolveHref(href, from);
  return target.startsWith("/") ? `${SITE}${target}` : target;
}

/** Rewrites every markdown link in a file so it works from this site. */
export function absolutize(md: string, from: string) {
  return md.replace(
    /(!?\[(?:[^\][]|\[[^\]]*\])*\]\()([^)\s]+)(\))/g,
    (_, open: string, href: string, close: string) =>
      `${open}${absolute(href, from)}${close}`,
  );
}

function demote(md: string) {
  let fence = false;
  return md
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) fence = !fence;
      return !fence && /^#{1,5}\s/.test(line) ? `#${line}` : line;
    })
    .join("\n");
}

function stamp(stack: Pick<Tetrastack, "sha" | "updatedAt">) {
  const day = new Date(stack.updatedAt).toISOString().slice(0, 10);
  return `${TETRASTACK_URL} at ${stack.sha.slice(0, 7)} (${day})`;
}

function pictureUrl(picture: Picture) {
  return picture.src.startsWith("/") ? `${SITE}${picture.src}` : picture.src;
}

export function tasteBookMarkdown(
  stack: Tetrastack,
  files: TetrastackFiles["files"],
  extra: TasteRecord[],
) {
  const parts = [
    `> from ${stack.origin === "snapshot" ? "a saved copy of " : ""}${stamp(stack)}. append \`.md\` to any ${SITE}/taste/… link for its markdown.\n`,
    absolutize(files["taste.md"] ?? "", "taste.md").trim(),
    `## direction files\n\n${stack.directions
      .map(
        (d) =>
          `- [${d.name}](${SITE}/taste/directions/${d.slug}.md) (${d.status}): ${d.sources.length} sources`,
      )
      .join("\n")}`,
    ...stack.stack.map((layer) =>
      demote(
        absolutize(
          splitFrontmatter(files[`stack/${layer.slug}.md`] ?? "").content,
          `stack/${layer.slug}.md`,
        ).trim(),
      ).replace(/^## /, "## stack: "),
    ),
    demote(absolutize(files["rejected.md"] ?? "", "rejected.md").trim()),
  ];
  if (extra.length)
    parts.push(
      `## also collected\n\n${extra.map((item) => demote(demote(tasteMarkdown(item)))).join("\n---\n\n")}`,
    );
  return `${parts.join("\n\n")}\n`;
}

export function directionMarkdown(
  stack: Pick<Tetrastack, "sha" | "updatedAt" | "origin">,
  direction: Direction,
  file: string,
  ctx: { index: EntryIndex; previews: Map<string, Preview> },
) {
  const from = `directions/${direction.slug}.md`;
  const images = direction.sources.flatMap((source) => {
    const { picture } = join(source, ctx.index, ctx.previews);
    return picture
      ? [
          `- ![${source.label}](${pictureUrl(picture)}) ${source.label}${picture.credit ? ` (${picture.credit})` : ""}: ${source.url}`,
        ]
      : [];
  });
  return `> from ${stamp(stack)}. the page: ${SITE}/taste/directions/${direction.slug}\n\n${absolutize(file, from).trim()}\n${
    images.length
      ? `\n## images\n\nwhat the sources look like, for a first look. still open the sources themselves.\n\n${images.join("\n")}\n`
      : ""
  }`;
}
