"use client";

import { type Preloaded, usePreloadedQuery } from "convex/react";
import Image from "next/image";
import { Markdown } from "@/components/markdown";
import { PageHeader } from "@/components/page-header";
import type { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";

const selectedTitles = ["shfla", "re:zero", "pocket realms! :d"];

function WorkLinks({ item }: { item: Doc<"work"> }) {
  return (
    <div className="editorial-links">
      {item.links?.map((link) => (
        <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
          {link.label} ↗
        </a>
      ))}
    </div>
  );
}

export function WorkClient({
  preloadedWork,
}: {
  preloadedWork: Preloaded<typeof api.work.list>;
}) {
  const work = [...usePreloadedQuery(preloadedWork)].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
  const selected = selectedTitles.flatMap((title) =>
    work.filter(
      (item) => item.type === "project" && item.title.toLowerCase() === title,
    ),
  );
  const rest = work.filter(
    (item) => item.type === "project" && !selected.includes(item),
  );
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <PageHeader
        path="/work"
        title="work"
        subtitle=""
        action={
          <a href="/resume.pdf" target="_blank" rel="noreferrer">
            resume ↗
          </a>
        }
      />
      <section className="experience-list" aria-label="Experience">
        {work
          .filter((item) => item.type === "job")
          .map((item) => (
            <article key={item._id}>
              <div>
                <h2>{item.title}</h2>
                {item.content && <Markdown content={item.content} />}
                <WorkLinks item={item} />
              </div>
              <p className="entry-date">
                {item.date}
                {item.endDate && ` – ${item.endDate}`}
              </p>
            </article>
          ))}
      </section>
      {selected.length > 0 && (
        <section className="work-selected" aria-labelledby="selected-work">
          <h2 id="selected-work" className="section-title">
            selected projects
          </h2>
          {selected.map((item) => (
            <article
              key={item._id}
              className={`work-feature ${item.imageUrl ? "" : "work-feature-text"}`}
            >
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  width={600}
                  height={450}
                  className="work-image"
                  unoptimized
                />
              )}
              <div>
                <h3>{item.title}</h3>
                {item.content && <Markdown content={item.content} />}
                <WorkLinks item={item} />
              </div>
            </article>
          ))}
        </section>
      )}
      {[
        { title: "more projects", items: rest },
        ...["paper", "talk", "other"].map((type) => ({
          title:
            type === "paper"
              ? "papers"
              : type === "talk"
                ? "talks"
                : "elsewhere",
          items: work.filter((item) => item.type === type),
        })),
      ]
        .filter((group) => group.items.length)
        .map((group) => (
          <section key={group.title} className="work-rest">
            <h2 className="section-title">{group.title}</h2>
            {group.items.map((item) => (
              <article key={item._id}>
                <h3>{item.title}</h3>
                {item.content && <Markdown content={item.content} />}
                <WorkLinks item={item} />
              </article>
            ))}
          </section>
        ))}
      {!work.length && <p>no work added yet.</p>}
    </div>
  );
}
