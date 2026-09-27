"use client";

import { type Preloaded, usePreloadedQuery } from "convex/react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { TasteCard } from "@/components/taste-card";
import { useListMotion } from "@/hooks/use-list-motion";
import type { api } from "../../../convex/_generated/api";
import {
  categoryLabel,
  filterTaste,
  type TasteFilter,
  tasteCategories,
  tasteSearch,
} from "../../../shared/taste";

export function TasteClient({
  preloadedItems,
  initialFilter,
}: {
  preloadedItems: Preloaded<typeof api.taste.list>;
  initialFilter: TasteFilter;
}) {
  const items = usePreloadedQuery(preloadedItems);
  const [filter, setFilter] = useState(initialFilter);
  const [limit, setLimit] = useState(30);
  const root = useListMotion();
  const categories = [...new Set(items.flatMap(tasteCategories))].sort((a, b) =>
    categoryLabel(a).localeCompare(categoryLabel(b)),
  );
  const qualities = [
    ...new Set(items.flatMap((item) => item.qualities ?? [])),
  ].sort();
  const filtered = filterTaste(items, filter);
  function change(patch: Partial<TasteFilter>) {
    const next = { ...filter, ...patch };
    setFilter(next);
    setLimit(30);
    const query = tasteSearch(next);
    window.history.replaceState(null, "", `/taste${query ? `?${query}` : ""}`);
  }
  useEffect(() => {
    const restore = () => {
      const p = new URLSearchParams(location.search);
      setFilter({
        q: p.get("q") ?? "",
        category: p.get("category") ?? "",
        quality: p.get("quality") ?? "",
      });
      setLimit(30);
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  const active = !!(filter.q || filter.category || filter.quality);
  return (
    <div
      ref={root}
      className="max-w-6xl mx-auto px-4 py-12 motion-list taste-index"
    >
      <PageHeader path="/taste" title="taste" subtitle="" />
      <div className="collection-tools">
        <div className="collection-search">
          <input
            type="search"
            aria-label="Search taste"
            maxLength={300}
            placeholder="search the collection"
            value={filter.q}
            onChange={(event) => change({ q: event.target.value })}
          />
          {filter.q && (
            <button type="button" onClick={() => change({ q: "" })}>
              clear
            </button>
          )}
        </div>
        <div className="taste-filter-options">
          <label>
            what it is
            <select
              value={filter.category}
              onChange={(event) => change({ category: event.target.value })}
            >
              <option value="">everything</option>
              {filter.category && !categories.includes(filter.category) && (
                <option value={filter.category}>
                  {categoryLabel(filter.category)}
                </option>
              )}
              {categories.map((category) => (
                <option key={category} value={category}>
                  {categoryLabel(category)}
                </option>
              ))}
            </select>
          </label>
          {(qualities.length > 0 || filter.quality) && (
            <label>
              what i notice
              <select
                value={filter.quality}
                onChange={(event) => change({ quality: event.target.value })}
              >
                <option value="">any quality</option>
                {filter.quality && !qualities.includes(filter.quality) && (
                  <option>{filter.quality}</option>
                )}
                {qualities.map((quality) => (
                  <option key={quality}>{quality}</option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>
      {active && (
        <output className="search-feedback">
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          <button
            type="button"
            onClick={() => change({ q: "", category: "", quality: "" })}
          >
            clear filters
          </button>
        </output>
      )}
      <div className="taste-collection">
        {filtered.slice(0, limit).map((item, index) => (
          <TasteCard
            key={item._id}
            item={item}
            filter={filter}
            delay={active ? 0 : index}
          />
        ))}
      </div>
      {!filtered.length && (
        <p>
          {active
            ? "nothing matches those filters."
            : "nothing collected here yet."}
        </p>
      )}
      {filtered.length > limit && (
        <button
          type="button"
          className="text-action"
          onClick={() => setLimit(limit + 30)}
        >
          show more
        </button>
      )}
    </div>
  );
}
