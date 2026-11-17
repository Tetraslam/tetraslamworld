import "server-only";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import type { TasteRecord } from "../../../shared/taste";
import {
  DIRECTION_SAMPLES,
  indexEntries,
  sourcesNeedingPreviews,
} from "../../../shared/taste-book";
import { getTetrastack } from "./load";
import { getPreviews } from "./previews";

/** Published taste entries. An unreachable backend means no images, not an error page. */
export async function getTasteEntries(): Promise<TasteRecord[]> {
  try {
    return (await fetchQuery(api.taste.list, {})) as TasteRecord[];
  } catch (error) {
    console.error("taste: collection unavailable", error);
    return [];
  }
}

export async function getTasteBook() {
  const [stack, entries] = await Promise.all([
    getTetrastack(),
    getTasteEntries(),
  ]);
  const index = indexEntries(entries);
  const wanted = [
    ...stack.taste.groups.flatMap((group) =>
      group.references.flatMap((ref) => (ref.url ? [ref.url] : [])),
    ),
    // A few spares per direction, since not every source has an image.
    ...stack.directions.flatMap((direction) =>
      direction.sources.slice(0, DIRECTION_SAMPLES + 2).map((s) => s.url),
    ),
  ];
  const previews = await getPreviews(sourcesNeedingPreviews(wanted, index));
  return { stack, entries, index, previews };
}

export async function getDirectionPage(slug: string) {
  const [stack, entries] = await Promise.all([
    getTetrastack(),
    getTasteEntries(),
  ]);
  const position = stack.directions.findIndex((d) => d.slug === slug);
  if (position === -1) return null;
  const direction = stack.directions[position];
  const index = indexEntries(entries);
  const previews = await getPreviews(
    sourcesNeedingPreviews(
      direction.sources.map((s) => s.url),
      index,
    ),
  );
  return {
    stack,
    direction,
    previous: stack.directions[position - 1],
    next: stack.directions[position + 1],
    index,
    previews,
  };
}
