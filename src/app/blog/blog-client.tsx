"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { IntentLink as Link } from "@/components/intent-link";
import { PageHeader } from "@/components/page-header";
import { Subscribe } from "@/components/subscribe";
import { useListMotion } from "@/hooks/use-list-motion";
import { isAdminUser } from "@/lib/admin";
import type { AtomEntry } from "@/lib/blog";
import { entranceStyle } from "@/lib/motion";

type Filters = {
  q: string;
  kind: string;
  tag: string;
  topic: string;
  series: string;
};
export function BlogClient({
  initialPosts,
  initialFilter = { q: "", kind: "", tag: "", topic: "", series: "" },
  native = false,
}: {
  initialPosts: AtomEntry[];
  initialFilter?: Filters;
  native?: boolean;
}) {
  const root = useListMotion(),
    { user } = useUser();
  const [filter, setFilter] = useState(initialFilter),
    [matches, setMatches] = useState<Set<string> | null>(null),
    [searching, setSearching] = useState(false),
    [error, setError] = useState("");
  const [limit, setLimit] = useState(30);
  function change(patch: Partial<Filters>) {
    const next = { ...filter, ...patch };
    setFilter(next);
    setLimit(30);
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next))
      if (value) params.set(key, value);
    window.history.replaceState(
      null,
      "",
      `/blog${params.size ? `?${params}` : ""}`,
    );
  }
  useEffect(() => {
    const pop = () => {
      const q = new URLSearchParams(location.search);
      setFilter({
        q: q.get("q") || "",
        kind: q.get("kind") || "",
        tag: q.get("tag") || "",
        topic: q.get("topic") || "",
        series: q.get("series") || "",
      });
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    if (!native || !filter.q.trim()) {
      setMatches(null);
      setSearching(false);
      setError("");
      return;
    }
    const abort = new AbortController();
    setSearching(true);
    const timer = setTimeout(
      () =>
        void fetch(`/api/writing/search?q=${encodeURIComponent(filter.q)}`, {
          signal: abort.signal,
        })
          .then(async (r) => {
            if (!r.ok)
              throw new Error("full-text search is temporarily unavailable.");
            const data = await r.json();
            setMatches(
              new Set(data.items.map((item: { slug: string }) => item.slug)),
            );
            setError("");
          })
          .catch((e) => {
            if (e.name !== "AbortError") {
              setError(e.message);
              setMatches(null);
            }
          })
          .finally(() => {
            if (!abort.signal.aborted) setSearching(false);
          }),
      300,
    );
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [native, filter.q]);
  const topics = [
      ...new Set(initialPosts.flatMap((p) => p.topics || [])),
    ].sort(),
    tags = [...new Set(initialPosts.flatMap((p) => p.tags || []))].sort(),
    series = [
      ...new Set(
        initialPosts.map((p) => p.series).filter((v): v is string => !!v),
      ),
    ].sort();
  const filtered = initialPosts
    .filter(
      (post) =>
        (!filter.kind || post.kind === filter.kind) &&
        (!filter.tag || post.tags?.includes(filter.tag)) &&
        (!filter.topic || post.topics?.includes(filter.topic)) &&
        (!filter.series || post.series === filter.series) &&
        (!filter.q.trim() ||
          (native && matches
            ? matches.has(post.slug)
            : `${post.title} ${post.summary || ""}`
                .toLocaleLowerCase()
                .includes(filter.q.toLocaleLowerCase().trim()))),
    )
    .sort((a, b) => Date.parse(b.published) - Date.parse(a.published));
  const shown = filtered.slice(0, limit),
    years = [
      ...new Set(shown.map((p) => new Date(p.published).getUTCFullYear())),
    ];
  return (
    <div ref={root} className="max-w-4xl mx-auto px-4 py-12 motion-list">
      <PageHeader
        path="/blog"
        title="writing"
        subtitle=""
        action={
          user && isAdminUser(user.id) ? (
            <Link href="/admin/writing">write</Link>
          ) : undefined
        }
      />
      <div className="collection-tools writing-public-filters">
        <div className="collection-search">
          <input
            type="search"
            aria-label="Search writing"
            placeholder="search writing"
            maxLength={300}
            value={filter.q}
            onChange={(e) => change({ q: e.target.value })}
          />
          {filter.q && (
            <button type="button" onClick={() => change({ q: "" })}>
              clear
            </button>
          )}
        </div>
        {native && (
          <select
            aria-label="Writing form"
            value={filter.kind}
            onChange={(e) => change({ kind: e.target.value })}
          >
            <option value="">all writing</option>
            <option value="essay">essays</option>
            <option value="note">notes</option>
          </select>
        )}
        {(
          [
            ["topic", topics],
            ["tag", tags],
            ["series", series],
          ] as const
        ).map(
          ([key, choices]) =>
            (choices.length > 0 || filter[key]) && (
              <select
                key={key}
                aria-label={key}
                value={filter[key]}
                onChange={(e) => change({ [key]: e.target.value })}
              >
                <option value="">
                  all {key === "series" ? "series" : `${key}s`}
                </option>
                {filter[key] && !choices.includes(filter[key]) && (
                  <option>{filter[key]}</option>
                )}
                {choices.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            ),
        )}
      </div>
      {Object.values(filter).some(Boolean) && (
        <output className="search-feedback">
          {searching
            ? "searching…"
            : `${filtered.length} ${filtered.length === 1 ? "post" : "posts"}`}{" "}
          <button
            type="button"
            onClick={() =>
              change({ q: "", kind: "", tag: "", topic: "", series: "" })
            }
          >
            clear filters
          </button>
        </output>
      )}
      {error && <output>{error} showing title and summary matches.</output>}
      {years.map((year) => (
        <section key={year} className="writing-year">
          <h2>{year}</h2>
          <div>
            {shown
              .filter((p) => new Date(p.published).getUTCFullYear() === year)
              .map((post, index) => (
                <article
                  key={post.id}
                  className="enter-item"
                  data-motion-key={post.id}
                  style={entranceStyle(index)}
                >
                  <h3>
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  {post.summary && post.summary !== post.title && (
                    <p>{post.summary}</p>
                  )}
                  <time dateTime={post.published}>
                    {new Date(post.published).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      ...(post.published.length === 10
                        ? { timeZone: "UTC" }
                        : {}),
                    })}
                    {post.kind === "note" ? " · note" : ""}
                  </time>
                </article>
              ))}
          </div>
        </section>
      ))}
      {!searching && !filtered.length && <p>no posts match those filters.</p>}
      {filtered.length > limit && (
        <button
          type="button"
          className="text-action"
          onClick={() => setLimit(limit + 30)}
        >
          more writing
        </button>
      )}
      <Subscribe />
    </div>
  );
}
