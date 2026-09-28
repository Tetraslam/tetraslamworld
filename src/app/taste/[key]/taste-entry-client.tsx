"use client";

import { type Preloaded, usePreloadedQuery } from "convex/react";
import { IntentLink } from "@/components/intent-link";
import { TasteEntryView } from "@/components/taste/entry";
import type { api } from "../../../../convex/_generated/api";
import {
  filterTaste,
  sortTaste,
  type TasteFilter,
  tasteHref,
  tasteSearch,
} from "../../../../shared/taste";

export function TasteEntryClient({
  id,
  preloadedItems,
  filter,
}: {
  id: string;
  preloadedItems: Preloaded<typeof api.taste.list>;
  filter: TasteFilter;
}) {
  const items = usePreloadedQuery(preloadedItems);
  const entry = items.find((item) => item._id === id);
  const matches = filterTaste(items, filter);
  const collection = matches.some((item) => item._id === id)
    ? matches
    : sortTaste(items);
  const index = collection.findIndex((item) => item._id === id);
  const previous = collection[index - 1],
    next = collection[index + 1];
  const query = tasteSearch(filter);
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 taste-entry-page">
      <nav
        className="taste-entry-navigation"
        aria-label="Collection navigation"
      >
        <IntentLink href={`/taste${query ? `?${query}` : ""}`}>
          ← taste
        </IntentLink>
        <div>
          {previous && (
            <IntentLink
              href={tasteHref(previous, filter)}
              aria-label={`Previous entry: ${previous.title}`}
            >
              ← previous
            </IntentLink>
          )}
          {next && (
            <IntentLink
              href={tasteHref(next, filter)}
              aria-label={`Next entry: ${next.title}`}
            >
              next →
            </IntentLink>
          )}
        </div>
      </nav>
      {entry ? (
        <TasteEntryView entry={entry} />
      ) : (
        <p>this entry is no longer in the public collection.</p>
      )}
      {entry && (
        <nav className="taste-next-entry" aria-label="Continue exploring">
          {next ? (
            <IntentLink href={tasteHref(next, filter)}>
              <span>next</span>
              {next.title} →
            </IntentLink>
          ) : (
            <IntentLink href={`/taste${query ? `?${query}` : ""}`}>
              back to the collection →
            </IntentLink>
          )}
        </nav>
      )}
    </div>
  );
}
