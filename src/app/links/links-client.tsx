"use client";

import { type Preloaded, useMutation, usePreloadedQuery } from "convex/react";
import { useRef, useState } from "react";
import { Markdown } from "@/components/markdown";
import { PageHeader } from "@/components/page-header";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useListMotion } from "@/hooks/use-list-motion";
import { entranceStyle } from "@/lib/motion";
import { api } from "../../../convex/_generated/api";

export function LinksClient({
  preloadedLinks,
}: {
  preloadedLinks: Preloaded<typeof api.links.list>;
}) {
  const links = usePreloadedQuery(preloadedLinks);
  const motionRoot = useListMotion();
  const suggest = useMutation(api.linkSuggestions.create);
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("");
  const [sort, setSort] = useState("curated");
  const [limit, setLimit] = useState(30);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const pending = useRef(false);
  const topics = [...new Set(links.flatMap((link) => link.tags ?? []))].sort();
  const filtered = links
    .filter(
      (link) =>
        (!topic || link.tags?.includes(topic)) &&
        `${link.title} ${link.url} ${link.content ?? ""} ${link.tags?.join(" ") ?? ""}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
    )
    .sort((a, b) =>
      sort === "alpha"
        ? a.title.localeCompare(b.title)
        : sort === "newest"
          ? b.createdAt - a.createdAt
          : Number(!!b.pinned) - Number(!!a.pinned) ||
            (a.order ?? Infinity) - (b.order ?? Infinity) ||
            b.createdAt - a.createdAt,
    );
  return (
    <div ref={motionRoot} className="max-w-4xl mx-auto px-4 py-12 motion-list">
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!pending.current) {
            setOpen(value);
            if (value) setStatus("idle");
          }
        }}
      >
        <PageHeader
          path="/links"
          title="links"
          subtitle=""
          action={
            <DialogTrigger asChild>
              <button type="button">suggest a link</button>
            </DialogTrigger>
          }
        />
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>suggest a link</DialogTitle>
          {status === "success" ? (
            <p>thanks! your suggestion is ready for review.</p>
          ) : (
            <form
              className="suggestion-form"
              onSubmit={async (event) => {
                event.preventDefault();
                if (pending.current) return;
                const data = new FormData(event.currentTarget);
                pending.current = true;
                setStatus("pending");
                try {
                  await suggest({
                    title: String(data.get("title")).trim(),
                    url: String(data.get("url")).trim(),
                    reason:
                      String(data.get("reason") ?? "").trim() || undefined,
                    submitterName:
                      String(data.get("name") ?? "").trim() || undefined,
                  });
                  setStatus("success");
                } catch {
                  setStatus("error");
                } finally {
                  pending.current = false;
                }
              }}
            >
              <fieldset disabled={status === "pending"}>
                <label htmlFor="suggest-title">title</label>
                <input
                  id="suggest-title"
                  name="title"
                  required
                  maxLength={300}
                />
                <label htmlFor="suggest-url">url</label>
                <input
                  id="suggest-url"
                  name="url"
                  type="url"
                  required
                  placeholder="https://"
                />
                <label htmlFor="suggest-reason">
                  why you like it <span>(optional)</span>
                </label>
                <textarea id="suggest-reason" name="reason" rows={3} />
                <label htmlFor="suggest-name">
                  your name <span>(optional)</span>
                </label>
                <input id="suggest-name" name="name" />
                <button type="submit" className="text-action">
                  {status === "pending" ? "sending…" : "send suggestion"}
                </button>
              </fieldset>
              {status === "error" && (
                <p role="alert">
                  couldn’t send that. your draft is still here; please try
                  again.
                </p>
              )}
            </form>
          )}
        </DialogContent>
      </Dialog>
      <div className="collection-tools">
        <div className="collection-search">
          <input
            type="search"
            aria-label="Search links"
            placeholder="search links"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setLimit(30);
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setLimit(30);
              }}
            >
              clear
            </button>
          )}
        </div>
        <label className="sr-only" htmlFor="link-topic">
          Topic
        </label>
        <select
          id="link-topic"
          value={topic}
          onChange={(e) => {
            setTopic(e.target.value);
            setLimit(30);
          }}
        >
          <option value="">all topics</option>
          {topics.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="link-sort">
          Order
        </label>
        <select
          id="link-sort"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setLimit(30);
          }}
        >
          <option value="curated">curated order</option>
          <option value="newest">newest first</option>
          <option value="alpha">alphabetical</option>
        </select>
      </div>
      {(search || topic) && (
        <output className="search-feedback">
          {filtered.length} {filtered.length === 1 ? "link" : "links"}{" "}
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setTopic("");
              setLimit(30);
            }}
          >
            reset search
          </button>
        </output>
      )}
      <div className="bookmark-list">
        {filtered.slice(0, limit).map((link, index) => {
          let domain = link.url;
          try {
            domain = new URL(link.url).hostname.replace(/^www\./, "");
          } catch {}
          return (
            <article
              key={link._id}
              className="enter-item"
              data-motion-key={link._id}
              style={entranceStyle(search || topic ? 0 : index)}
            >
              <h2>
                <a href={link.url} target="_blank" rel="noreferrer">
                  {link.title} <span aria-hidden="true">↗</span>
                </a>
              </h2>
              <p className="entry-domain">{domain}</p>
              {link.content && <Markdown content={link.content} />}
            </article>
          );
        })}
      </div>
      {!filtered.length && (
        <p>
          no links match.{" "}
          <button
            type="button"
            className="text-action"
            onClick={() => {
              setSearch("");
              setTopic("");
            }}
          >
            clear filters
          </button>
        </p>
      )}
      {filtered.length > limit && (
        <button
          type="button"
          className="text-action"
          onClick={() => setLimit(limit + 30)}
        >
          show more links
        </button>
      )}
    </div>
  );
}
