import { parse as parseYaml } from "yaml";

/**
 * tetrastack (github.com/Tetraslam/tetrastack) is the source of truth for the
 * taste page's structure and text. Everything here is pure: it turns the
 * repository's markdown files into the shapes the page renders. Anything the
 * parser doesn't recognise is kept as markdown, so new sections still show up.
 */

export const TETRASTACK_REPO = "Tetraslam/tetrastack";
export const TETRASTACK_URL = `https://github.com/${TETRASTACK_REPO}`;

export type TetrastackFiles = {
  /** Commit the files came from. */
  sha: string;
  /** Commit time in ms (from the archive's mtime). */
  updatedAt: number;
  origin: "github" | "local" | "snapshot";
  files: Record<string, string>;
};

export type Link = { label: string; url: string };

/** Files the site reads. Everything else in the repo is ignored. */
export function isTetrastackFile(path: string) {
  return /^(taste|rejected|README)\.md$|^(directions|stack)\/[\w-]+\.md$/.test(
    path,
  );
}

export type Section = {
  depth: number;
  /** Heading as written, markdown included. */
  heading: string;
  /** Heading as plain text. */
  title: string;
  id: string;
  /** Markdown between this heading and its first child heading. */
  body: string;
  children: Section[];
};

export type Bullet = {
  /** Full item markdown, without the leading "- ". */
  markdown: string;
  /** Bold lead such as "**hierarchy before decoration.**", without stars. */
  lead?: string;
  /** Markdown after the lead (or the whole item when there is none). */
  rest: string;
  links: Link[];
};

// ---------------------------------------------------------------------------
// generic markdown helpers

export function splitFrontmatter(md: string): {
  data: Record<string, unknown>;
  content: string;
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(md);
  if (!match) return { data: {}, content: md };
  let data: Record<string, unknown> = {};
  try {
    const parsed = parseYaml(match[1]);
    if (parsed && typeof parsed === "object")
      data = parsed as Record<string, unknown>;
  } catch {
    // A broken frontmatter block shouldn't hide the file.
  }
  return { data, content: md.slice(match[0].length) };
}

export function plainText(md: string) {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(value: string) {
  return (
    plainText(value)
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "section"
  );
}

/** Links in a markdown fragment, in order. Images are skipped. */
export function extractLinks(md: string): Link[] {
  const links: Link[] = [];
  for (const match of md.matchAll(
    /(!?)\[((?:[^\][]|\[[^\]]*\])*)\]\(([^)\s]+)\)/g,
  )) {
    if (match[1]) continue;
    links.push({ label: plainText(match[2]), url: match[3] });
  }
  return links;
}

/** Splits markdown into a heading tree. Fenced code is left alone. */
export function sections(md: string): Section {
  const root: Section = {
    depth: 0,
    heading: "",
    title: "",
    id: "",
    body: "",
    children: [],
  };
  const stack: Section[] = [root];
  const bodies = new Map<Section, string[]>([[root, []]]);
  let fence = false;
  for (const line of md.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    const heading = fence ? null : /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (!heading) {
      bodies.get(stack[stack.length - 1])?.push(line);
      continue;
    }
    const depth = heading[1].length;
    while (stack.length > 1 && stack[stack.length - 1].depth >= depth)
      stack.pop();
    const section: Section = {
      depth,
      heading: heading[2],
      title: plainText(heading[2]),
      id: slugify(heading[2]),
      body: "",
      children: [],
    };
    stack[stack.length - 1].children.push(section);
    stack.push(section);
    bodies.set(section, []);
  }
  for (const [section, lines] of bodies) section.body = lines.join("\n").trim();
  return root;
}

export function findSection(root: Section, title: string) {
  const want = title.toLowerCase();
  const search = (section: Section): Section | undefined =>
    section.title.toLowerCase() === want
      ? section
      : section.children.map(search).find(Boolean);
  return search(root);
}

/** Top-level "- " items of a markdown body, with their continuation lines. */
export function bullets(md: string): Bullet[] {
  const items: string[][] = [];
  let current: string[] | null = null;
  for (const line of md.split(/\r?\n/)) {
    const start = /^[-*]\s+(.*)$/.exec(line);
    if (start) {
      current = [start[1]];
      items.push(current);
    } else if (current && line.trim() && /^\s+/.test(line)) {
      current.push(line.trim());
    } else {
      current = null;
    }
  }
  return items.map((lines) => {
    const markdown = lines.join("\n");
    const lead = /^\*\*(.+?)\*\*\s*[:.]?\s*/.exec(markdown);
    return {
      markdown,
      lead: lead ? lead[1].replace(/[.:]$/, "") : undefined,
      rest: lead ? markdown.slice(lead[0].length) : markdown,
      links: extractLinks(markdown),
    };
  });
}

/** Paragraphs of a markdown body, leaving out lists, tables, and code. */
export function prose(md: string) {
  const out: string[] = [];
  for (const block of md.split(/\n\s*\n/)) {
    const lines: string[] = [];
    for (const line of block.trim().split(/\r?\n/)) {
      // A list or table can start straight after a paragraph's last line.
      if (/^\s*([-*]\s|\||```|~~~)/.test(line)) break;
      lines.push(line);
    }
    const text = lines.join("\n").trim();
    if (text) out.push(text);
  }
  return out;
}

export function tables(md: string): string[][][] {
  const found: string[][][] = [];
  let rows: string[][] = [];
  const flush = () => {
    if (rows.length) found.push(rows);
    rows = [];
  };
  for (const line of md.split(/\r?\n/)) {
    if (!/^\s*\|/.test(line)) {
      flush();
      continue;
    }
    const cells = line
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((cell) => cell.trim());
    if (cells.every((cell) => /^:?-{2,}:?$/.test(cell) || !cell)) continue;
    rows.push(cells);
  }
  flush();
  return found;
}

// ---------------------------------------------------------------------------
// links

const SITE = /^https?:\/\/(?:www\.)?tetraslam\.world(?=\/|$)/i;

/**
 * Maps a link inside a tetrastack file to where it should go on the site.
 * Files that have a home on the taste page link there; everything else opens
 * the file on GitHub.
 */
export function resolveHref(href: string, from: string): string {
  if (/^(mailto:|tel:)/i.test(href)) return href;
  if (/^https?:\/\//i.test(href)) {
    if (SITE.test(href)) return href.replace(SITE, "") || "/";
    return href;
  }
  const [rawPath, hash] = href.split("#") as [string, string | undefined];
  const path = rawPath ? joinPath(dirname(from), rawPath) : from;
  const fragment = hash ? `#${hash}` : "";
  if (path === "taste.md") return `/taste${fragment || ""}`;
  if (path === "rejected.md") return "/taste#rejected";
  const direction = /^directions\/([\w-]+)\.md$/.exec(path);
  if (direction && direction[1] !== "README")
    return `/taste/directions/${direction[1]}${fragment}`;
  if (/^directions\/?$/.test(path) || path === "directions/README.md")
    return "/taste#directions";
  const layer = /^stack\/([\w-]+)\.md$/.exec(path);
  if (layer)
    return `/taste#${hash ? `${layer[1]}-${hash}` : `stack-${layer[1]}`}`;
  if (path === "README.md" && hash === "the-stack") return "/taste#stack";
  const isDir = !/\.[a-z0-9]+$/i.test(path);
  return `${TETRASTACK_URL}/${isDir ? "tree" : "blob"}/main/${path.replace(/\/$/, "")}${fragment}`;
}

function dirname(path: string) {
  const index = path.lastIndexOf("/");
  return index === -1 ? "" : path.slice(0, index);
}

function joinPath(base: string, relative: string) {
  const parts = base ? base.split("/") : [];
  for (const part of relative.split("/")) {
    if (part === "..") parts.pop();
    else if (part && part !== ".") parts.push(part);
  }
  return parts.join("/") + (relative.endsWith("/") ? "/" : "");
}

/** Key of a taste entry when a URL points at one (`/taste/<key>`). */
export function entryKeyFromUrl(url: string): string | null {
  const local = url.replace(SITE, "");
  const match = /^\/taste\/([^/?#]+)\/?$/.exec(local);
  if (!match || match[1] === "directions") return null;
  return decodeURIComponent(match[1]);
}

/** Comparable form of a URL, so a source link can match an entry's URL. */
export function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${host}${path}${parsed.search}`;
  } catch {
    return url;
  }
}

// ---------------------------------------------------------------------------
// taste.md

export type Constant = { lead: string; body: string; markdown: string };
export type DirectionSummary = {
  name: string;
  slug: string;
  /** e.g. "parc" in "**warm paper** (parc): …" */
  example?: string;
  summary: string;
};
export type Reference = {
  id: string;
  title: string;
  /** Heading markdown, links included. */
  heading: string;
  /** The heading's first external link: what the reference is. */
  url?: string;
  /** Other links in the heading (entry, design notes, inference, …). */
  links: Link[];
  /** Taste entry the reference points at, if any. */
  entryKey?: string;
  body: string;
  notes: Bullet[];
  intro: string[];
};
export type ReferenceGroup = {
  id: string;
  title: string;
  intro: string[];
  references: Reference[];
};
export type TasteDoc = {
  intro: string[];
  constants: { intro: string[]; items: Constant[] };
  directions: {
    intro: string[];
    items: DirectionSummary[];
    attractors?: { intro: string[]; items: Bullet[] };
  };
  bar?: { intro: string[]; items: Reference[] };
  groups: ReferenceGroup[];
};

const KNOWN = new Set(["constants", "directions", "the bar"]);

function toReference(section: Section, from: string): Reference {
  const links = extractLinks(section.heading).map((link) => ({
    ...link,
    url: resolveHref(link.url, from),
  }));
  const entryLink = links.find((link) => entryKeyFromUrl(link.url));
  const primary = links.find(
    (link) => /^https?:/.test(link.url) && link !== entryLink,
  );
  const bulletsInBody = bullets(section.body);
  return {
    id: section.id,
    title: plainText(section.heading.split(" · ")[0]),
    heading: section.heading,
    url: primary?.url,
    links: links.filter((link) => link !== primary),
    entryKey: entryLink
      ? (entryKeyFromUrl(entryLink.url) ?? undefined)
      : undefined,
    body: section.body,
    notes: bulletsInBody,
    intro: prose(section.body),
  };
}

/** A bullet like "[torph](url) ([entry](url)): note" as a reference. */
function bulletReference(bullet: Bullet, from: string): Reference {
  const head = /^(.*?\))(?::\s+|\s*$)/.exec(bullet.markdown);
  const heading = head ? head[1] : bullet.markdown;
  const links = extractLinks(heading).map((link) => ({
    ...link,
    url: resolveHref(link.url, from),
  }));
  const entryLink = links.find((link) => entryKeyFromUrl(link.url));
  const external = links.filter(
    (link) => /^https?:/.test(link.url) && link !== entryLink,
  );
  // "[a](…), [b](…), [c](…): note" is several things sharing one note.
  const primary = external.length === 1 ? external[0] : undefined;
  const note = head ? bullet.markdown.slice(head[0].length).trim() : "";
  const title = primary?.label ?? external.map((l) => l.label).join(", ");
  return {
    id: slugify(title),
    title,
    heading,
    url: primary?.url,
    links: links.filter((link) => link !== primary && link !== entryLink),
    entryKey: entryLink
      ? (entryKeyFromUrl(entryLink.url) ?? undefined)
      : undefined,
    body: note,
    notes: [],
    intro: note ? [note] : [],
  };
}

export function parseTaste(md: string): TasteDoc {
  const root = sections(splitFrontmatter(md).content);
  const top = root.children.find((section) => section.depth === 1) ?? root;
  const h2 = top.children;
  const constants = h2.find((s) => s.title === "constants");
  const directions = h2.find((s) => s.title === "directions");
  const attractors = directions?.children.find((s) => s.title === "attractors");
  const bar = h2.find((s) => s.title === "the bar");
  return {
    intro: prose(top.body),
    constants: {
      intro: prose(constants?.body ?? ""),
      items: bullets(constants?.body ?? "").map((item) => ({
        lead: item.lead ?? plainText(item.markdown).split(/[.:]/)[0],
        body: item.rest,
        markdown: item.markdown,
      })),
    },
    directions: {
      intro: prose(directions?.body ?? ""),
      items: bullets(directions?.body ?? "")
        .filter((item) => item.lead)
        .map((item) => {
          const example =
            /^\(((?:\[[^\]]*\]\([^)]*\)|[^()]|\([^)]*\))*)\)\s*:?\s*/.exec(
              item.rest,
            );
          const name = item.lead as string;
          return {
            name,
            slug: slugify(name),
            example: example ? example[1] : undefined,
            summary: example ? item.rest.slice(example[0].length) : item.rest,
          };
        }),
      attractors: attractors
        ? { intro: prose(attractors.body), items: bullets(attractors.body) }
        : undefined,
    },
    bar: bar
      ? {
          intro: prose(bar.body),
          items: bar.children.map((s) => toReference(s, "taste.md")),
        }
      : undefined,
    groups: h2
      .filter((s) => !KNOWN.has(s.title))
      .map((section) => ({
        id: section.id,
        title: section.title,
        intro: prose(section.body),
        references: section.children.length
          ? section.children.map((s) => toReference(s, "taste.md"))
          : bullets(section.body).map((b) => bulletReference(b, "taste.md")),
      })),
  };
}

// ---------------------------------------------------------------------------
// directions/*.md

export type DirectionSource = Link & { note: string; markdown: string };
export type DirectionPart = {
  id: string;
  title: string;
  /** Linked items: sources, sites on the web. */
  links: DirectionSource[];
  /** Unlinked list items, as markdown. */
  notes: string[];
  /** Paragraphs (and any subsections), as markdown. */
  prose: string[];
};
export type Direction = {
  slug: string;
  name: string;
  status: "draft" | "approved" | string;
  summary: string;
  parts: DirectionPart[];
  /** Every external link, in order, for previews. */
  sources: DirectionSource[];
};

export function parseDirection(slug: string, md: string): Direction {
  const { data, content } = splitFrontmatter(md);
  const from = `directions/${slug}.md`;
  const root = sections(content);
  const top = root.children.find((s) => s.depth === 1);
  const parts = (top?.children ?? root.children).map((section) => {
    const items = bullets(section.body);
    const links: DirectionSource[] = [];
    const notes: string[] = [];
    for (const item of items) {
      const first = /^\[((?:[^\][]|\[[^\]]*\])*)\]\(([^)\s]+)\)([\s\S]*)$/.exec(
        item.markdown,
      );
      if (first)
        links.push({
          label: plainText(first[1]),
          url: resolveHref(first[2], from),
          note: first[3]
            .replace(/^\s*(\([^)]*\))?\s*:?\s*/, (_, aside) =>
              aside ? `${aside} ` : "",
            )
            .trim(),
          markdown: item.markdown,
        });
      else notes.push(item.markdown);
    }
    const paragraphs = prose(section.body);
    for (const child of section.children)
      paragraphs.push(`**${child.title}**\n\n${child.body}`);
    return {
      id: section.id,
      title: section.title,
      links,
      notes,
      prose: paragraphs,
    };
  });
  const name =
    typeof data.direction === "string" ? data.direction : (top?.title ?? slug);
  return {
    slug,
    name,
    status: typeof data.status === "string" ? data.status : "draft",
    summary: prose(top?.body ?? "")[0] ?? "",
    parts,
    sources: parts.flatMap((part) =>
      part.links.filter((link) => /^https?:/.test(link.url)),
    ),
  };
}

// ---------------------------------------------------------------------------
// stack/*.md

export type Library = {
  id: string;
  name: string;
  url?: string;
  heading: string;
  /** Description paragraphs. */
  description: string[];
  /** "watch out", "not this", "mechanism", … */
  notes: { label: string; text: string }[];
  shippedIn: string[];
  /** Plain bullets that aren't labelled notes. */
  points: string[];
};
export type StackGroup = {
  id: string;
  title: string;
  intro: string[];
  libraries: Library[];
  /** Bullets for groups that list things instead of giving them headings. */
  items: Bullet[];
};
export type StackLayer = {
  slug: string;
  title: string;
  intro: string[];
  groups: StackGroup[];
};

/** Splits "a, b (c, d), e" on top-level commas. */
export function splitList(value: string) {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of value) {
    if (char === "(") depth++;
    if (char === ")") depth = Math.max(0, depth - 1);
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else current += char;
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

function toLibrary(section: Section, layer: string): Library {
  const links = extractLinks(section.heading);
  const from = `stack/${layer}.md`;
  const notes: Library["notes"] = [];
  const points: string[] = [];
  let shippedIn: string[] = [];
  for (const item of bullets(section.body)) {
    if (item.lead?.toLowerCase() === "shipped in") {
      const names = splitList(plainText(item.rest));
      // "parc and tetravoice use the older set (…)" is a sentence, not a list.
      if (names.every((name) => name.split(/\s+/).length <= 3))
        shippedIn = names;
      else notes.push({ label: item.lead, text: item.rest });
    } else if (item.lead) notes.push({ label: item.lead, text: item.rest });
    else points.push(item.markdown);
  }
  return {
    id: `${layer}-${section.id}`,
    name: plainText(section.heading),
    url: links[0] ? resolveHref(links[0].url, from) : undefined,
    heading: section.heading,
    description: prose(section.body),
    notes,
    shippedIn,
    points,
  };
}

export function parseStackLayer(slug: string, md: string): StackLayer {
  const root = sections(splitFrontmatter(md).content);
  const top = root.children.find((s) => s.depth === 1) ?? root;
  const groups: StackGroup[] = [];
  const direct = top.children.filter((s) => s.depth === 3);
  if (direct.length)
    groups.push({
      id: `${slug}-picks`,
      title: "",
      intro: [],
      libraries: direct.map((s) => toLibrary(s, slug)),
      items: [],
    });
  for (const section of top.children.filter((s) => s.depth === 2))
    groups.push({
      id: `${slug}-${section.id}`,
      title: section.title,
      intro: prose(section.body),
      libraries: section.children.map((s) => toLibrary(s, slug)),
      items: bullets(section.body),
    });
  return { slug, title: top.title || slug, intro: prose(top.body), groups };
}

/** Stack layer order, from the README's stack table. */
export function stackOrder(readme: string): string[] {
  return [...readme.matchAll(/\]\(stack\/([\w-]+)\.md\)/g)].map((m) => m[1]);
}

// ---------------------------------------------------------------------------
// rejected.md

export type RejectedTable = {
  id: string;
  title: string;
  intro: string[];
  head: string[];
  rows: string[][];
};

export function parseRejected(md: string) {
  const root = sections(md);
  const top = root.children.find((s) => s.depth === 1) ?? root;
  return {
    intro: prose(top.body),
    tables: top.children.map((section): RejectedTable => {
      const [head = [], ...rows] = tables(section.body)[0] ?? [];
      return {
        id: `rejected-${section.id}`,
        title: section.title,
        intro: prose(section.body),
        head,
        rows,
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// the whole repository

export type Tetrastack = {
  sha: string;
  updatedAt: number;
  origin: TetrastackFiles["origin"];
  taste: TasteDoc;
  directions: Direction[];
  stack: StackLayer[];
  rejected: ReturnType<typeof parseRejected>;
};

export function parseTetrastack(input: TetrastackFiles): Tetrastack {
  const { files } = input;
  const taste = parseTaste(files["taste.md"] ?? "");
  const directionFiles = Object.keys(files)
    .map((path) => /^directions\/([\w-]+)\.md$/.exec(path)?.[1])
    .filter((slug): slug is string => !!slug && slug !== "README");
  // taste.md's list sets the order; files it doesn't list yet go last.
  const listed = taste.directions.items.map((item) => item.slug);
  const order = [
    ...listed.filter((slug) => directionFiles.includes(slug)),
    ...directionFiles.filter((slug) => !listed.includes(slug)).sort(),
  ];
  const layers = Object.keys(files)
    .map((path) => /^stack\/([\w-]+)\.md$/.exec(path)?.[1])
    .filter((slug): slug is string => !!slug);
  const layerOrder = stackOrder(files["README.md"] ?? "");
  layers.sort(
    (a, b) =>
      (layerOrder.indexOf(a) + 1 || 99) - (layerOrder.indexOf(b) + 1 || 99) ||
      a.localeCompare(b),
  );
  return {
    sha: input.sha,
    updatedAt: input.updatedAt,
    origin: input.origin,
    taste,
    directions: order.map((slug) =>
      parseDirection(slug, files[`directions/${slug}.md`]),
    ),
    stack: layers.map((slug) =>
      parseStackLayer(slug, files[`stack/${slug}.md`]),
    ),
    rejected: parseRejected(files["rejected.md"] ?? ""),
  };
}

/** Every URL on the page that could carry a preview image. */
export function previewCandidates(stack: Tetrastack): string[] {
  const urls = new Set<string>();
  for (const direction of stack.directions)
    for (const source of direction.sources) urls.add(source.url);
  for (const group of stack.taste.groups)
    for (const reference of group.references)
      if (reference.url) urls.add(reference.url);
  return [...urls].filter((url) => /^https?:\/\//.test(url));
}
