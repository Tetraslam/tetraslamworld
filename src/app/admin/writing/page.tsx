"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { WritingEntry } from "../../../../shared/writing";
export default function WritingDesk() {
  const [items, setItems] = useState<WritingEntry[]>([]),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [ready, setReady] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(
      () => {
        setLoading(true);
        void fetch(`/api/writing?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        })
          .then(async (response) => {
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            setItems(data.entries);
            setReady(data.ready);
            setError("");
          })
          .catch((error) => {
            if (error.name !== "AbortError") setError(error.message);
          })
          .finally(() => {
            if (!controller.signal.aborted) setLoading(false);
          });
      },
      query ? 300 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  const visible = items.filter(
    (item) =>
      filter === "all" ||
      (filter === "scheduled" && item.schedule) ||
      (filter === "published" && item.published) ||
      (filter === "drafts" && !item.published),
  );
  return (
    <section className="writing-desk">
      <header>
        <div>
          <p className="writing-eyebrow">your writing</p>
          <h1>what’s on your mind?</h1>
        </div>
        <div className="writing-actions">
          <Link
            className="writing-primary"
            href="/admin/writing/new?kind=essay"
          >
            new essay
          </Link>
          <Link href="/admin/writing/new?kind=note">new note</Link>
        </div>
      </header>
      <div className="writing-desk-filters">
        <input
          type="search"
          aria-label="Search writing"
          placeholder="find a draft, a phrase, an idea…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Writing status"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">all writing</option>
          <option value="drafts">drafts</option>
          <option value="published">published</option>
          <option value="scheduled">scheduled</option>
        </select>
      </div>
      {!ready && !loading && !error && (
        <p className="writing-notice">
          the archive is being verified. your drafts are private; the existing
          blog remains online.
        </p>
      )}
      {error && (
        <p role="alert" className="writing-notice">
          {error}{" "}
          <button type="button" onClick={() => window.location.reload()}>
            retry
          </button>
        </p>
      )}
      {loading && (
        <output className="writing-muted">loading your writing…</output>
      )}
      <div className="writing-draft-list">
        {visible.map((item) => (
          <Link key={item.id} href={`/admin/writing/${item.id}`}>
            <div>
              <span className="writing-eyebrow">
                {item.draft.kind} ·{" "}
                {item.schedule
                  ? "scheduled"
                  : item.published
                    ? "published + draft"
                    : "draft"}
              </span>
              <h2>
                {item.draft.title || item.draft.summary || "untitled note"}
              </h2>
              {item.draft.summary && item.draft.title && (
                <p>{item.draft.summary}</p>
              )}
            </div>
            <time dateTime={item.updatedAt}>
              {new Date(item.updatedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </time>
          </Link>
        ))}
      </div>
      {!loading && !error && !visible.length && (
        <p className="writing-empty">
          {query
            ? "nothing matches that search."
            : "a few sentences are enough to begin."}
        </p>
      )}
    </section>
  );
}
