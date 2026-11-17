import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IntentLink } from "@/components/intent-link";
import { Markdown } from "@/components/taste/book/markdown";
import { Credit, hostOf, PictureFrame } from "@/components/taste/book/picture";
import { Provenance } from "@/components/taste/book/provenance";
import { getDirectionPage } from "@/lib/tetrastack/book";
import { getTetrastack } from "@/lib/tetrastack/load";
import { join } from "../../../../../shared/taste-book";
import { plainText } from "../../../../../shared/tetrastack";

export const revalidate = 300;

export async function generateStaticParams() {
  const stack = await getTetrastack();
  return stack.directions.map((direction) => ({ slug: direction.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const stack = await getTetrastack();
  const direction = stack.directions.find((d) => d.slug === slug);
  return {
    title: direction ? direction.name : "direction not found",
    description: direction ? plainText(direction.summary) : undefined,
    alternates: {
      canonical: `/taste/directions/${slug}`,
      types: { "text/markdown": `/taste/directions/${slug}.md` },
    },
  };
}

export default async function DirectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getDirectionPage(slug);
  if (!page) notFound();
  const { direction, previous, next, stack } = page;
  const ctx = { index: page.index, previews: page.previews };
  const from = `directions/${direction.slug}.md`;
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 direction-page">
      <nav className="taste-entry-navigation" aria-label="Directions">
        <IntentLink href="/taste#directions">← directions</IntentLink>
        <div>
          {previous && (
            <IntentLink
              href={`/taste/directions/${previous.slug}`}
              aria-label={`Previous direction: ${previous.name}`}
            >
              ← previous
            </IntentLink>
          )}
          {next && (
            <IntentLink
              href={`/taste/directions/${next.slug}`}
              aria-label={`Next direction: ${next.name}`}
            >
              next →
            </IntentLink>
          )}
        </div>
      </nav>
      <header className="direction-heading">
        <h1>
          {direction.name}
          {direction.status !== "approved" && (
            <span
              className="direction-status"
              title="unreviewed: a lead, not yet curated"
            >
              {direction.status}
            </span>
          )}
        </h1>
        <div className="book-lede">
          <Markdown from={from}>{direction.summary}</Markdown>
          <Provenance stack={stack} path={from} />
        </div>
      </header>
      {direction.parts.map((part) => (
        <section
          key={part.id}
          className="direction-part"
          aria-labelledby={part.id}
        >
          <h2 id={part.id}>{part.title}</h2>
          {part.links.length > 0 && (
            <div className="direction-sources">
              {part.links.map((source, i) => {
                const joined = /^https?:/.test(source.url)
                  ? join(source, ctx.index, ctx.previews)
                  : { picture: null, href: source.url, entry: undefined };
                const href = source.url;
                return (
                  <article
                    key={`${source.url}-${i}`}
                    className="direction-source"
                  >
                    {joined.picture && (
                      <figure>
                        <a href={href} target="_blank" rel="noreferrer">
                          <PictureFrame
                            picture={joined.picture}
                            sizes="(max-width: 760px) 92vw, 460px"
                            priority={i < 2 && part === direction.parts[0]}
                          />
                        </a>
                      </figure>
                    )}
                    <h3>
                      {href.startsWith("/") ? (
                        <IntentLink href={href}>{source.label}</IntentLink>
                      ) : (
                        <a href={href} target="_blank" rel="noreferrer">
                          {source.label}
                        </a>
                      )}
                      {/^https?:/.test(href) && <small>{hostOf(href)} ↗</small>}
                    </h3>
                    {source.note && (
                      <Markdown from={from} className="book-source-note">
                        {source.note}
                      </Markdown>
                    )}
                    {joined.picture &&
                      (joined.entry ? (
                        <IntentLink
                          className="book-credit"
                          href={joined.href ?? "/taste"}
                        >
                          in the collection →
                        </IntentLink>
                      ) : (
                        <Credit
                          picture={joined.picture}
                          redundantWith={[source.label, hostOf(href)]}
                        />
                      ))}
                  </article>
                );
              })}
            </div>
          )}
          {part.notes.length > 0 && (
            <ul className="book-notes direction-notes">
              {part.notes.map((note) => (
                <li key={note}>
                  <Markdown from={from} inline>
                    {note}
                  </Markdown>
                </li>
              ))}
            </ul>
          )}
          {part.prose.length > 0 && (
            <div
              className={
                part.title === "avoid" ? "direction-avoid" : "direction-notes"
              }
            >
              {part.prose.map((text) => (
                <Markdown
                  key={text}
                  from={from}
                  className={part.title === "avoid" ? undefined : "book-intro"}
                >
                  {text}
                </Markdown>
              ))}
            </div>
          )}
        </section>
      ))}
      <nav className="direction-footer" aria-label="Continue">
        {previous ? (
          <IntentLink href={`/taste/directions/${previous.slug}`}>
            <span>previous</span>← {previous.name}
          </IntentLink>
        ) : (
          <IntentLink href="/taste#directions">← all directions</IntentLink>
        )}
        {next ? (
          <IntentLink href={`/taste/directions/${next.slug}`}>
            <span>next</span>
            {next.name} →
          </IntentLink>
        ) : (
          <IntentLink href="/taste#directions">all directions →</IntentLink>
        )}
      </nav>
    </div>
  );
}
