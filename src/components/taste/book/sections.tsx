import type { CSSProperties } from "react";
import { IntentLink } from "@/components/intent-link";
import { TasteCard } from "@/components/taste-card";
import { entranceStyle } from "@/lib/motion";
import type { Preview } from "../../../../shared/previews";
import type { TasteRecord } from "../../../../shared/taste";
import {
  DIRECTION_SAMPLES,
  type EntryIndex,
  join,
  type Picture,
} from "../../../../shared/taste-book";
import type {
  Direction,
  Reference,
  Tetrastack,
} from "../../../../shared/tetrastack";
import { Markdown } from "./markdown";
import { Credit, hostOf, PictureFrame } from "./picture";

type Ctx = { index: EntryIndex; previews: Map<string, Preview> };

export function Out({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return href.startsWith("/") ? (
    <IntentLink href={href} className={className}>
      {children}
    </IntentLink>
  ) : (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  );
}

function SectionHeading({
  id,
  title,
  count,
}: {
  id: string;
  title: string;
  count?: number;
}) {
  return (
    <h2 className="book-section-title" id={id}>
      <a href={`#${id}`}>{title}</a>
      {count !== undefined && <span>{count}</span>}
    </h2>
  );
}

// ---------------------------------------------------------------------------

export function Constants({ stack }: { stack: Tetrastack }) {
  const { constants } = stack.taste;
  if (!constants.items.length) return null;
  return (
    <section className="book-section" aria-labelledby="constants">
      <SectionHeading id="constants" title="constants" />
      {constants.intro.map((text) => (
        <Markdown key={text} className="book-intro">
          {text}
        </Markdown>
      ))}
      <ol className="book-constants">
        {constants.items.map((item, index) => (
          <li
            key={item.lead}
            className="enter-item"
            style={entranceStyle(index)}
          >
            <h3>{item.lead}</h3>
            <Markdown className="book-constant-body">{item.body}</Markdown>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ---------------------------------------------------------------------------

function Plate({
  reference,
  ctx,
  headingLevel = 3,
}: {
  reference: Reference;
  ctx: Ctx;
  headingLevel?: 3 | 4;
}) {
  const joined = join(reference, ctx.index, ctx.previews);
  const H = `h${headingLevel}` as "h3" | "h4";
  const title = joined.href ? (
    <Out href={joined.href}>{reference.title}</Out>
  ) : (
    reference.title
  );
  const several = !reference.url && reference.links.length > 1;
  const extra = reference.links.filter(
    (link) => !joined.entry || link.url !== joined.href,
  );
  return (
    <article
      className={`book-plate ${joined.picture ? "" : "book-plate-text"}`}
      id={reference.id}
    >
      {joined.picture && (
        <figure className="book-plate-figure">
          {joined.href ? (
            <Out href={joined.href} className="book-picture-link">
              <PictureFrame
                picture={joined.picture}
                sizes="(max-width: 760px) 92vw, 420px"
              />
            </Out>
          ) : (
            <PictureFrame
              picture={joined.picture}
              sizes="(max-width: 760px) 92vw, 420px"
            />
          )}
          {joined.picture.origin === "preview" && (
            <figcaption>
              <Credit
                picture={joined.picture}
                redundantWith={[
                  reference.title,
                  reference.url ? hostOf(reference.url) : "",
                ]}
              />
            </figcaption>
          )}
        </figure>
      )}
      <div className="book-plate-copy">
        {several ? (
          <H className="book-plate-title book-plate-list">
            {reference.links.map((link, i) => (
              <span key={link.url}>
                {i > 0 && ", "}
                <Out href={link.url}>{link.label}</Out>
              </span>
            ))}
          </H>
        ) : (
          <H className="book-plate-title">{title}</H>
        )}
        {(reference.url || (!several && extra.length > 0)) && (
          <p className="book-plate-links">
            {reference.url && (
              <a href={reference.url} target="_blank" rel="noreferrer">
                {hostOf(reference.url)} ↗
              </a>
            )}
            {!several &&
              extra.map((link) => (
                <Out key={link.url} href={link.url}>
                  {link.label}
                  {link.url.startsWith("/") ? "" : " ↗"}
                </Out>
              ))}
          </p>
        )}
        {reference.notes.length > 0 ? (
          <>
            {reference.intro.map((text) => (
              <Markdown key={text} className="book-plate-intro">
                {text}
              </Markdown>
            ))}
            <ul className="book-notes">
              {reference.notes.map((note) => (
                <li
                  key={note.markdown}
                  className={note.lead === "signature" ? "book-signature" : ""}
                >
                  <Markdown inline>{note.markdown}</Markdown>
                </li>
              ))}
            </ul>
          </>
        ) : (
          reference.body && (
            <Markdown className="book-plate-intro">{reference.body}</Markdown>
          )
        )}
      </div>
    </article>
  );
}

export function TheBar({ stack, ctx }: { stack: Tetrastack; ctx: Ctx }) {
  const bar = stack.taste.bar;
  if (!bar) return null;
  // "the upload field · delve-onsite" borrows delve-onsite's picture.
  const references = stack.taste.groups.flatMap((g) => g.references);
  return (
    <section className="book-section" aria-labelledby="the-bar">
      <SectionHeading id="the-bar" title="the bar" />
      {bar.intro.map((text) => (
        <Markdown key={text} className="book-intro">
          {text}
        </Markdown>
      ))}
      <div className="book-plates">
        {bar.items.map((item) => {
          const where = item.heading.split(" · ")[1]?.trim();
          const twin = references.find((ref) => ref.title === where);
          return (
            <Plate
              key={item.id}
              reference={{
                ...item,
                title: item.title,
                url: twin?.url,
                entryKey: twin?.entryKey,
                links: where ? [] : item.links,
              }}
              ctx={ctx}
            />
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

export function directionPictures(direction: Direction, ctx: Ctx) {
  const pictures: { picture: Picture; label: string }[] = [];
  for (const source of direction.sources) {
    const { picture } = join(source, ctx.index, ctx.previews);
    // Two sources can share an entry; show its picture once.
    if (picture && !pictures.some((p) => p.picture.src === picture.src))
      pictures.push({ picture, label: source.label });
    if (pictures.length === DIRECTION_SAMPLES) break;
  }
  return pictures;
}

/** Shape of each tile in a 4:3 cover, for the image optimiser's crop hint. */
function tileRatio(count: number, wide: boolean, index: number) {
  if (count === 1) return 4 / 3;
  if (count === 2) return wide ? 8 / 3 : 2 / 3;
  if (wide) return 2;
  return index === 0 ? 0.8 : 1.2;
}

function DirectionCard({
  direction,
  ctx,
  example,
  position,
}: {
  direction: Direction;
  ctx: Ctx;
  example?: string;
  position: number;
}) {
  const pictures = directionPictures(direction, ctx);
  const href = `/taste/directions/${direction.slug}`;
  // Screenshots and og images are wide; prints and posters are tall. The
  // lead picture picks the collage so it gets cropped the least.
  const lead = pictures[0]?.picture;
  const wide = !!lead && lead.width / Math.max(1, lead.height) > 1.15;
  return (
    <article
      className="book-direction enter-item"
      style={entranceStyle(position)}
    >
      <IntentLink
        href={href}
        className="book-direction-cover"
        data-count={pictures.length}
        data-shape={wide ? "wide" : "tall"}
        aria-label={`${direction.name}: ${direction.sources.length} sources`}
        tabIndex={-1}
      >
        {pictures.length ? (
          pictures.map(({ picture }, i) => (
            <PictureFrame
              key={picture.src}
              picture={{ ...picture, alt: "" }}
              ratio={tileRatio(pictures.length, wide, i)}
              fill
              sizes={
                i === 0
                  ? "(max-width: 760px) 92vw, 380px"
                  : "(max-width: 760px) 46vw, 190px"
              }
            />
          ))
        ) : (
          <span className="book-direction-word">{direction.name}</span>
        )}
      </IntentLink>
      <h3>
        <IntentLink href={href}>{direction.name}</IntentLink>
        {example && (
          <span className="book-example">
            {" "}
            (<Markdown inline>{example}</Markdown>)
          </span>
        )}
      </h3>
      <Markdown className="book-direction-summary">
        {direction.summary}
      </Markdown>
      <p className="book-direction-meta">
        {direction.sources.length}{" "}
        {direction.sources.length === 1 ? "source" : "sources"}
        {direction.status !== "approved" && (
          <span title="unreviewed: a lead, not yet curated">
            {" "}
            · {direction.status}
          </span>
        )}
      </p>
    </article>
  );
}

export function Directions({ stack, ctx }: { stack: Tetrastack; ctx: Ctx }) {
  const { directions } = stack.taste;
  const examples = new Map(
    directions.items.map((item) => [item.slug, item.example]),
  );
  return (
    <section className="book-section" aria-labelledby="directions">
      <SectionHeading
        id="directions"
        title="directions"
        count={stack.directions.length}
      />
      <div className="book-intro-columns">
        {directions.intro.map((text) => (
          <Markdown key={text} className="book-intro">
            {text}
          </Markdown>
        ))}
      </div>
      <div className="book-directions">
        {stack.directions.map((direction, i) => (
          <DirectionCard
            key={direction.slug}
            direction={direction}
            ctx={ctx}
            example={examples.get(direction.slug)}
            position={i}
          />
        ))}
      </div>
      {directions.attractors && (
        <aside className="book-attractors" aria-labelledby="attractors">
          <h3 id="attractors">attractors</h3>
          {directions.attractors.intro.map((text) => (
            <Markdown key={text} className="book-intro">
              {text}
            </Markdown>
          ))}
          <dl>
            {directions.attractors.items.map((item) => (
              <div key={item.markdown}>
                <dt>{item.lead}</dt>
                <dd>
                  <Markdown inline>{item.rest}</Markdown>
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------

export function References({ stack, ctx }: { stack: Tetrastack; ctx: Ctx }) {
  if (!stack.taste.groups.length) return null;
  return (
    <section className="book-section" aria-labelledby="references">
      <SectionHeading id="references" title="references" />
      {stack.taste.groups.map((group) => (
        <div key={group.id} className="book-group">
          <h3 className="book-group-title" id={group.id}>
            {group.title}
          </h3>
          {group.intro.map((text) => (
            <Markdown key={text} className="book-intro">
              {text}
            </Markdown>
          ))}
          <div
            className={
              group.references.every((r) => !r.notes.length)
                ? "book-plates book-plates-compact"
                : "book-plates"
            }
          >
            {group.references.map((reference) => (
              <Plate
                key={reference.id}
                reference={reference}
                ctx={ctx}
                headingLevel={4}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export function AlsoCollected({ items }: { items: TasteRecord[] }) {
  if (!items.length) return null;
  return (
    <section className="book-section" aria-labelledby="collected">
      <SectionHeading id="collected" title="also collected" />
      <div className="taste-collection">
        {items.map((item, index) => (
          <TasteCard key={item._id} item={item} delay={index} />
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

export function Stack({ stack }: { stack: Tetrastack }) {
  if (!stack.stack.length) return null;
  return (
    <section className="book-section" aria-labelledby="stack">
      <SectionHeading id="stack" title="stack" />
      <div className="book-layers">
        {stack.stack.map((layer) => {
          const from = `stack/${layer.slug}.md`;
          const picks = layer.groups[0]?.title
            ? []
            : (layer.groups[0]?.libraries ?? []);
          return (
            <details
              key={layer.slug}
              id={`stack-${layer.slug}`}
              className="book-layer"
            >
              <summary>
                <span className="book-layer-name">{layer.title}</span>
                <span className="book-layer-picks">
                  {picks.map((library) => library.name).join(" · ")}
                </span>
              </summary>
              <div className="book-layer-body">
                {layer.intro.map((text) => (
                  <Markdown key={text} from={from} className="book-intro">
                    {text}
                  </Markdown>
                ))}
                {layer.groups.map((group) => (
                  <div
                    key={group.id}
                    id={group.id}
                    className="book-layer-group"
                  >
                    {group.title && <h4>{group.title}</h4>}
                    {group.title &&
                      group.intro.map((text) => (
                        <Markdown key={text} from={from} className="book-intro">
                          {text}
                        </Markdown>
                      ))}
                    {group.libraries.length > 0 && (
                      <div className="book-libraries">
                        {group.libraries.map((library) => (
                          <article key={library.id} id={library.id}>
                            <h5>
                              {library.url ? (
                                <Out href={library.url}>{library.name}</Out>
                              ) : (
                                library.name
                              )}
                            </h5>
                            {library.description.map((text) => (
                              <Markdown key={text} from={from}>
                                {text}
                              </Markdown>
                            ))}
                            {library.points.length > 0 && (
                              <ul className="book-notes">
                                {library.points.map((point) => (
                                  <li key={point}>
                                    <Markdown inline from={from}>
                                      {point}
                                    </Markdown>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {library.notes.length > 0 && (
                              <dl className="book-library-notes">
                                {library.notes.map((note) => (
                                  <div key={note.label}>
                                    <dt>{note.label}</dt>
                                    <dd>
                                      <Markdown inline from={from}>
                                        {note.text}
                                      </Markdown>
                                    </dd>
                                  </div>
                                ))}
                              </dl>
                            )}
                            {library.shippedIn.length > 0 && (
                              <p className="book-shipped">
                                shipped in {library.shippedIn.join(", ")}
                              </p>
                            )}
                          </article>
                        ))}
                      </div>
                    )}
                    {group.items.length > 0 && (
                      <ul className="book-notes">
                        {group.items.map((item) => (
                          <li key={item.markdown}>
                            <Markdown inline from={from}>
                              {item.markdown}
                            </Markdown>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

export function Rejected({ stack }: { stack: Tetrastack }) {
  const { rejected } = stack;
  if (!rejected.tables.length) return null;
  return (
    <section className="book-section" aria-labelledby="rejected">
      <SectionHeading id="rejected" title="rejected" />
      {rejected.intro.map((text) => (
        <Markdown key={text} from="rejected.md" className="book-intro">
          {text}
        </Markdown>
      ))}
      <div className="book-rejected">
        {rejected.tables.map((table) => (
          <div key={table.id} id={table.id}>
            <h3 className="book-group-title">{table.title}</h3>
            {table.intro.map((text) => (
              <Markdown key={text} from="rejected.md" className="book-intro">
                {text}
              </Markdown>
            ))}
            <table
              className="book-table"
              style={{ "--columns": table.head.length } as CSSProperties}
            >
              <thead>
                <tr>
                  {table.head.map((cell) => (
                    <th key={cell} scope="col">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={row.join("|")}>
                    {row.map((cell, i) => (
                      <td key={`${i}-${cell}`}>
                        <Markdown inline from="rejected.md">
                          {cell}
                        </Markdown>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </section>
  );
}
