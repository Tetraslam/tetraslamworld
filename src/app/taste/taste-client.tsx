"use client";

import { track } from "@vercel/analytics";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import { useMemo, useRef, useState } from "react";
import { TasteCard } from "@/components/taste-card";
import { TasteListItem } from "@/components/taste-list-item";
import { api } from "../../../convex/_generated/api";

type SortOrder = "manual" | "newest" | "oldest" | "alpha";
type ViewMode = "cards" | "list";

export function TasteClient({
  preloadedItems,
}: {
  preloadedItems: Preloaded<typeof api.taste.list>;
}) {
  const items = usePreloadedQuery(preloadedItems);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("manual");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (value.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        track("search_query", { page: "taste", query: value.trim() });
      }, 1000);
    }
  };

  // Extract unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    items?.forEach((item) => {
      if (item.tags) {
        for (const tag of item.tags) {
          tagSet.add(tag);
        }
      }
    });
    return Array.from(tagSet).sort();
  }, [items]);

  // Filter and sort
  const filtered = useMemo(() => {
    if (!items) return [];

    const result = items.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q) ||
        item.content?.toLowerCase().includes(q) ||
        item.designNotes?.toLowerCase().includes(q) ||
        item.tags?.some((t) => t.toLowerCase().includes(q));

      const matchesTag = !tagFilter || item.tags?.includes(tagFilter);

      return matchesSearch && matchesTag;
    });

    result.sort((a, b) => {
      if (sortOrder === "manual") {
        if (a.order !== undefined && b.order !== undefined)
          return a.order - b.order;
        if (a.order === undefined && b.order === undefined)
          return b.createdAt - a.createdAt;
        if (a.order !== undefined) return -1;
        return 1;
      }
      if (sortOrder === "alpha") return a.title.localeCompare(b.title);
      return sortOrder === "newest"
        ? b.createdAt - a.createdAt
        : a.createdAt - b.createdAt;
    });

    return result;
  }, [items, search, tagFilter, sortOrder]);

  const hasActiveFilters = search || tagFilter || sortOrder !== "manual";

  const clearAllFilters = () => {
    setSearch("");
    setTagFilter(null);
    setSortOrder("manual");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">taste</h1>
          <p className="text-muted-foreground mt-1">
            design inspiration and aesthetic references
          </p>
        </div>

        {/* Search and filters */}
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="search inspiration..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-rose/50 text-foreground placeholder:text-muted-foreground transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                &times;
              </button>
            )}
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tag filter */}
            {allTags.length > 0 && (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">tag:</span>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setTagFilter(null)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        tagFilter === null
                          ? "bg-rose/20 text-rose border border-rose/50"
                          : "bg-surface border border-border text-muted-foreground hover:border-rose/30"
                      }`}
                    >
                      all
                    </button>
                    {allTags.slice(0, 5).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setTagFilter(tag);
                          track("filter_use", {
                            page: "taste",
                            filter_type: "tag",
                            value: tag,
                          });
                        }}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          tagFilter === tag
                            ? "bg-rose/20 text-rose border border-rose/50"
                            : "bg-surface border border-border text-muted-foreground hover:border-rose/30"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                    {allTags.length > 5 && (
                      <select
                        value={tagFilter || ""}
                        onChange={(e) => setTagFilter(e.target.value || null)}
                        className="px-2 py-1 text-xs rounded bg-surface border border-border text-muted-foreground focus:outline-none focus:border-rose/30"
                      >
                        <option value="">more...</option>
                        {allTags.slice(5).map((tag) => (
                          <option key={tag} value={tag}>
                            {tag}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <span className="text-border">|</span>
              </>
            )}

            {/* Sort order */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">sort:</span>
              <div className="flex gap-1">
                {(
                  [
                    ["manual", "curated"],
                    ["newest", "newest"],
                    ["oldest", "oldest"],
                    ["alpha", "a-z"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setSortOrder(value);
                      track("filter_use", {
                        page: "taste",
                        filter_type: "sort",
                        value,
                      });
                    }}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      sortOrder === value
                        ? "bg-rose/20 text-rose border border-rose/50"
                        : "bg-surface border border-border text-muted-foreground hover:border-rose/30"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-border">|</span>

            {/* View toggle */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">view:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("cards");
                    track("filter_use", { page: "taste", filter_type: "view", value: "cards" });
                  }}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    viewMode === "cards"
                      ? "bg-rose/20 text-rose border border-rose/50"
                      : "bg-surface border border-border text-muted-foreground hover:border-rose/30"
                  }`}
                >
                  cards
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("list");
                    track("filter_use", { page: "taste", filter_type: "view", value: "list" });
                  }}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    viewMode === "list"
                      ? "bg-rose/20 text-rose border border-rose/50"
                      : "bg-surface border border-border text-muted-foreground hover:border-rose/30"
                  }`}
                >
                  list
                </button>
              </div>
            </div>

            {/* Clear all filters */}
            {hasActiveFilters && (
              <>
                <span className="text-border">|</span>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-2 py-1 text-xs text-muted-foreground hover:text-rose transition-colors"
                >
                  clear all
                </button>
              </>
            )}
          </div>

          {/* Results count */}
          {items && (
            <div className="text-xs text-muted-foreground">
              {filtered.length} of {items.length} entr
              {items.length !== 1 ? "ies" : "y"}
              {hasActiveFilters && " found"}
            </div>
          )}
        </div>

        {/* Content */}
        {filtered.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            {hasActiveFilters
              ? "no entries match your filters"
              : "no taste entries yet"}
          </div>
        ) : viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((item, index) => (
              <TasteCard key={item._id} item={item} delay={index * 50} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item, index) => (
              <TasteListItem key={item._id} item={item} delay={index * 30} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
