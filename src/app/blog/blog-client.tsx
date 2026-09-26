"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback, useState } from "react";
import { IntentLink as Link } from "@/components/intent-link";
import { PageHeader } from "@/components/page-header";
import { Subscribe } from "@/components/subscribe";

interface Post {
  id: string;
  slug: string;
  title: string;
  published: string;
  summary?: string;
}
const admins = (process.env.NEXT_PUBLIC_ADMIN_USER_IDS ?? "").split(",");

export function BlogClient({ initialPosts }: { initialPosts: Post[] }) {
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    setError(false);
    try {
      const response = await fetch("/api/blog");
      if (!response.ok) throw new Error("feed unavailable");
      const data = await response.json();
      setPosts(data.posts ?? []);
    } catch {
      setError(true);
    }
  }, []);
  const filtered = posts
    .filter((post) =>
      `${post.title} ${post.summary ?? ""}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    )
    .sort((a, b) => Date.parse(b.published) - Date.parse(a.published));
  const years = [
    ...new Set(filtered.map((post) => new Date(post.published).getFullYear())),
  ];
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <PageHeader
        path="/blog"
        title="writing"
        subtitle=""
        action={
          user && admins.includes(user.id) ? (
            <button
              type="button"
              disabled={refreshing}
              onClick={async () => {
                setRefreshing(true);
                try {
                  const response = await fetch("/api/blog/revalidate", {
                    method: "POST",
                  });
                  if (!response.ok) throw new Error();
                  await load();
                } catch {
                  setError(true);
                } finally {
                  setRefreshing(false);
                }
              }}
            >
              {refreshing ? "refreshing…" : "refresh"}
            </button>
          ) : undefined
        }
      />
      <div className="collection-search">
        <input
          type="search"
          aria-label="Search writing"
          placeholder="search writing"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {search && (
          <button type="button" onClick={() => setSearch("")}>
            clear
          </button>
        )}
      </div>
      {error ? (
        <p>
          couldn’t load the writing.{" "}
          <button type="button" className="text-action" onClick={load}>
            try again
          </button>
        </p>
      ) : filtered.length ? (
        years.map((year) => (
          <section key={year} className="writing-year">
            <h2>{year}</h2>
            <div>
              {filtered
                .filter(
                  (post) => new Date(post.published).getFullYear() === year,
                )
                .map((post) => (
                  <article key={post.id}>
                    <h3>
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>
                    {post.summary && <p>{post.summary}</p>}
                    <time dateTime={post.published}>
                      {new Date(post.published).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </article>
                ))}
            </div>
          </section>
        ))
      ) : (
        <p>no posts{search ? " match your search" : " yet"}.</p>
      )}
      <Subscribe />
    </div>
  );
}
