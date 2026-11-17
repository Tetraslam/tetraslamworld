import type { Preview } from "./previews";
import { previewPath } from "./previews";
import {
  type TasteRecord,
  tasteCover,
  tasteHref,
  tasteKey,
  tasteMedia,
} from "./taste";
import {
  entryKeyFromUrl,
  normalizeUrl,
  type Reference,
  type Tetrastack,
} from "./tetrastack";

/**
 * Joins tetrastack's links with the taste collection in Convex. A link
 * matches an entry when it points at the entry (`/taste/<key>`) or at the
 * same page the entry is about. Entries carry hand-picked images; everything
 * else falls back to a preview resolved from the source.
 */

/** Sample images per direction card on the index. */
export const DIRECTION_SAMPLES = 3;

export type Picture = {
  src: string;
  width: number;
  height: number;
  alt: string;
  credit?: string;
  /** Where the credit points (the source page). */
  creditUrl?: string;
  /** Convex storage images are optimised by next/image; others aren't. */
  origin: "entry" | "preview";
  /** False when the size is a guess (older entries), so frames crop. */
  exact: boolean;
};

export type EntryIndex = {
  byKey: Map<string, TasteRecord>;
  byUrl: Map<string, TasteRecord>;
};

export function indexEntries(items: TasteRecord[]): EntryIndex {
  const byKey = new Map<string, TasteRecord>();
  const byUrl = new Map<string, TasteRecord>();
  for (const item of items) {
    byKey.set(item._id, item);
    byKey.set(tasteKey(item), item);
    if (item.url && !byUrl.has(normalizeUrl(item.url)))
      byUrl.set(normalizeUrl(item.url), item);
  }
  return { byKey, byUrl };
}

export function findEntry(
  index: EntryIndex,
  link: { url?: string; entryKey?: string },
): TasteRecord | undefined {
  if (link.entryKey) {
    const found = index.byKey.get(link.entryKey);
    if (found) return found;
  }
  if (!link.url) return undefined;
  const key = entryKeyFromUrl(link.url);
  if (key) return index.byKey.get(key);
  return index.byUrl.get(normalizeUrl(link.url));
}

/** The entry's cover as a still picture, if it has one. */
export function entryPicture(item: TasteRecord): Picture | null {
  const media = tasteMedia(item);
  const cover = tasteCover(item);
  const ordered = cover ? [cover, ...media.filter((m) => m !== cover)] : media;
  for (const asset of ordered) {
    const src =
      asset.kind === "image" && !asset.animated
        ? asset.url
        : (asset.poster ?? (asset.kind === "image" ? asset.url : undefined));
    if (!src) continue;
    return {
      src,
      width: asset.width ?? 1600,
      height: asset.height ?? 900,
      alt: asset.alt || item.title,
      credit: asset.credit,
      creditUrl: asset.creditUrl,
      origin: "entry",
      exact: !!(asset.width && asset.height && item.media !== undefined),
    };
  }
  return null;
}

export function previewPicture(preview: Preview, label?: string): Picture {
  return {
    src: previewPath(preview.source),
    width: preview.width,
    height: preview.height,
    alt: preview.alt || label || "",
    credit: preview.credit,
    creditUrl: preview.source,
    origin: "preview",
    exact: true,
  };
}

export type Joined = {
  entry?: TasteRecord;
  /** Where the title should take you: the entry if there is one. */
  href?: string;
  picture: Picture | null;
};

export function join(
  link: { url?: string; entryKey?: string; label?: string },
  index: EntryIndex,
  previews: Map<string, Preview>,
): Joined {
  const entry = findEntry(index, link);
  const picture =
    (entry && entryPicture(entry)) ||
    (link.url && previews.has(link.url)
      ? previewPicture(previews.get(link.url) as Preview, link.label)
      : null);
  return { entry, href: entry ? tasteHref(entry) : link.url, picture };
}

/** Entries no tetrastack link points at, in the collection's order. */
export function unreferenced(
  items: TasteRecord[],
  stack: Tetrastack,
): TasteRecord[] {
  const index = indexEntries(items);
  const seen = new Set<string>();
  const mark = (link: { url?: string; entryKey?: string }) => {
    const found = findEntry(index, link);
    if (found) seen.add(found._id);
  };
  const refs: Reference[] = [
    ...stack.taste.groups.flatMap((group) => group.references),
    ...(stack.taste.bar?.items ?? []),
  ];
  for (const ref of refs) {
    mark(ref);
    for (const link of ref.links) mark(link);
  }
  for (const direction of stack.directions)
    for (const source of direction.sources) mark(source);
  return items.filter((item) => !seen.has(item._id));
}

/** Sources worth a preview: those that no entry already illustrates. */
export function sourcesNeedingPreviews(
  urls: string[],
  index: EntryIndex,
): string[] {
  return urls.filter((url) => {
    const entry = findEntry(index, { url });
    return !(entry && entryPicture(entry));
  });
}
