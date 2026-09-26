"use client";

import { type Preloaded, usePreloadedQuery } from "convex/react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { TasteCard } from "@/components/taste-card";
import { useListMotion } from "@/hooks/use-list-motion";
import type { api } from "../../../convex/_generated/api";

export function TasteClient({
  preloadedItems,
}: {
  preloadedItems: Preloaded<typeof api.taste.list>;
}) {
  const items = usePreloadedQuery(preloadedItems);
  const motionRoot = useListMotion();
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("");
  const topics = [...new Set(items.flatMap((item) => item.tags ?? []))].sort();
  const filtered = items
    .filter(
      (item) =>
        (!topic || item.tags?.includes(topic)) &&
        `${item.title} ${item.content ?? ""} ${item.designNotes ?? ""} ${item.tags?.join(" ") ?? ""}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
    )
    .sort(
      (a, b) =>
        (a.order ?? Infinity) - (b.order ?? Infinity) ||
        b.createdAt - a.createdAt,
    );
  return (
    <div ref={motionRoot} className="max-w-5xl mx-auto px-4 py-12 motion-list">
      <PageHeader path="/taste" title="taste" subtitle="" />
      <div className="collection-tools">
        <div className="collection-search">
          <input
            type="search"
            aria-label="Search taste"
            placeholder="search references and notes"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")}>
              clear
            </button>
          )}
        </div>
        <label htmlFor="taste-topic" className="sr-only">
          Topic
        </label>
        <select
          id="taste-topic"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
        >
          <option value="">all topics</option>
          {topics.map((tag) => (
            <option key={tag}>{tag}</option>
          ))}
        </select>
      </div>
      {(search || topic) && (
        <output className="search-feedback">
          {filtered.length} references{" "}
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setTopic("");
            }}
          >
            reset search
          </button>
        </output>
      )}
      <div className="taste-journal">
        {filtered.map((item, index) => (
          <TasteCard
            key={item._id}
            item={item}
            delay={search || topic ? 0 : index}
          />
        ))}
      </div>
      {!filtered.length && <p>no references match your search.</p>}
    </div>
  );
}
