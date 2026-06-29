import { fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import { api } from "../../../../../convex/_generated/api";

const SITE_URL = "https://tetraslam.world";

function mdResponse(text: string): NextResponse {
  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}

// Strip HTML tags for plain text extraction from blog content
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

// Generic: render any item's fields as markdown
function renderItem(item: Record<string, unknown>, opts?: { titleField?: string; skipFields?: string[] }): string {
  const titleField = opts?.titleField || "title";
  const skipFields = new Set([
    "_id", "_creationTime", "order", "altOrder", "altImageOrder", "showInBoth",
    "createdAt", "featured", "fromSuggestionId", titleField,
    ...(opts?.skipFields || []),
  ]);

  const title = item[titleField] as string | undefined;
  let out = title ? `### ${title}\n\n` : "";

  for (const [key, value] of Object.entries(item)) {
    if (skipFields.has(key) || value === undefined || value === null) continue;

    if (key === "url" && typeof value === "string") {
      out += `- **URL**: ${value}\n`;
    } else if (key === "imageUrl" && typeof value === "string") {
      out += `- **Image**: ![image](${value})\n`;
    } else if (key === "imageUrls" && Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        out += `- ![image ${i + 1}](${value[i]})\n`;
      }
    } else if (key === "screenshotUrls" && Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        out += `- ![screenshot ${i + 1}](${value[i]})\n`;
      }
    } else if (key === "photoUrls" && Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        out += `- ![photo ${i + 1}](${value[i]})\n`;
      }
    } else if (key === "tags" && Array.isArray(value)) {
      out += `- **Tags**: ${value.join(", ")}\n`;
    } else if (key === "links" && Array.isArray(value)) {
      for (const link of value as { label: string; url: string }[]) {
        out += `- [${link.label}](${link.url})\n`;
      }
    } else if (key === "coordinates" && typeof value === "object") {
      const coords = value as { lat: number; lng: number };
      out += `- **Coordinates**: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}\n`;
    } else if (key === "dates" && typeof value === "object") {
      const dates = value as { start?: string; end?: string };
      if (dates.start || dates.end) {
        out += `- **Dates**: ${dates.start || ""}${dates.end ? ` — ${dates.end}` : ""}\n`;
      }
    } else if (key === "date" && typeof value === "string") {
      const endDate = item.endDate as string | undefined;
      out += `- **Date**: ${value}${endDate ? ` — ${endDate}` : ""}\n`;
    } else if (key === "endDate") {
      // handled by "date"
    } else if (key === "pinned" && value === true) {
      out += `- **Pinned**: yes\n`;
    } else if (key === "type" && typeof value === "string") {
      out += `- **Type**: ${value}\n`;
    } else if (key === "content" && typeof value === "string") {
      out += `\n${value}\n`;
    } else if (key === "designNotes" && typeof value === "string") {
      out += `\n> **Design notes:** ${value}\n`;
    } else if (key === "caption" && typeof value === "string") {
      out += `- **Caption**: ${value}\n`;
    } else if (key === "summary" && typeof value === "string") {
      out += `\n${value}\n`;
    } else if (key === "published" && typeof value === "string") {
      out += `- **Published**: ${new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}\n`;
    } else if (key === "location" && typeof value === "string") {
      // already used as title for travel
    }
  }

  return out + "\n";
}

// Page configs: how to fetch and organize each page's data
interface PageConfig {
  title: string;
  subtitle: string;
  fetch: () => Promise<Record<string, unknown>[]>;
  sort?: (items: Record<string, unknown>[]) => Record<string, unknown>[];
  groupBy?: { field: string; labels: Record<string, string>; order: string[] };
  titleField?: string;
  skipFields?: string[];
}

const defaultSort = (items: Record<string, unknown>[]) =>
  [...items].sort((a, b) => {
    const oa = (a.order as number | undefined) ?? 0;
    const ob = (b.order as number | undefined) ?? 0;
    return oa - ob;
  });

const manualThenNewestSort = (items: Record<string, unknown>[]) =>
  [...items].sort((a, b) => {
    const oa = a.order as number | undefined;
    const ob = b.order as number | undefined;
    if (oa !== undefined && ob !== undefined) return oa - ob;
    if (oa === undefined && ob === undefined)
      return ((b.createdAt as number) ?? 0) - ((a.createdAt as number) ?? 0);
    if (oa !== undefined) return -1;
    return 1;
  });

const pages: Record<string, PageConfig> = {
  taste: {
    title: "taste",
    subtitle: "design inspiration and aesthetic references",
    fetch: () => fetchQuery(api.taste.list, {}) as Promise<Record<string, unknown>[]>,
    sort: manualThenNewestSort,
  },
  work: {
    title: "work",
    subtitle: "things i've built, written, and done",
    fetch: () => fetchQuery(api.work.list, {}) as Promise<Record<string, unknown>[]>,
    groupBy: {
      field: "type",
      labels: { job: "Experience", project: "Projects", paper: "Papers", talk: "Talks", other: "Other" },
      order: ["job", "project", "paper", "talk", "other"],
    },
    sort: defaultSort,
  },
  media: {
    title: "media",
    subtitle: "things i've consumed and enjoyed",
    fetch: () => fetchQuery(api.media.list, {}) as Promise<Record<string, unknown>[]>,
    groupBy: {
      field: "type",
      labels: { anime: "Anime", manga: "Manga", book: "Books", game: "Games", music: "Music", movie: "Movies", show: "Shows", other: "Other" },
      order: ["anime", "manga", "book", "game", "music", "movie", "show", "other"],
    },
    sort: defaultSort,
  },
  links: {
    title: "links",
    subtitle: "bookmarks, resources, and interesting finds",
    fetch: () => fetchQuery(api.links.list, {}) as Promise<Record<string, unknown>[]>,
    sort: manualThenNewestSort,
  },
  friends: {
    title: "friends",
    subtitle: "people i think are cool",
    fetch: () => fetchQuery(api.friends.list, {}) as Promise<Record<string, unknown>[]>,
    titleField: "name",
    sort: defaultSort,
  },
  gallery: {
    title: "gallery",
    subtitle: "random snapshots and visual ephemera",
    fetch: () => fetchQuery(api.gallery.list, {}) as Promise<Record<string, unknown>[]>,
    sort: defaultSort,
    skipFields: ["imageUrl"],
  },
  travel: {
    title: "travel",
    subtitle: "places i've been",
    fetch: () => fetchQuery(api.travel.list, {}) as Promise<Record<string, unknown>[]>,
    titleField: "location",
    sort: defaultSort,
  },
};

async function generatePageMd(config: PageConfig): Promise<string> {
  const items = await config.fetch();
  const sorted = config.sort ? config.sort(items) : items;

  let out = `# ${config.title} — ${config.subtitle}\n\n`;
  out += `> ${items.length} entries on [tetraslam.world/${config.title}](${SITE_URL}/${config.title})\n\n`;

  if (config.groupBy) {
    const { field, labels, order } = config.groupBy;
    const grouped: Record<string, Record<string, unknown>[]> = {};
    for (const item of sorted) {
      const key = item[field] as string;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }

    for (const type of order) {
      const group = grouped[type];
      if (!group?.length) continue;
      out += `## ${labels[type] || type}\n\n`;
      for (const item of group) {
        out += renderItem(item, { titleField: config.titleField, skipFields: config.skipFields });
      }
    }
  } else if (config.title === "gallery") {
    // Gallery: render as image list
    for (const item of sorted) {
      const caption = item.caption as string | undefined;
      const url = item.imageUrl as string;
      out += caption
        ? `- ![${caption}](${url}) — ${caption}\n`
        : `- ![Gallery image](${url})\n`;
    }
  } else {
    for (const item of sorted) {
      out += renderItem(item, { titleField: config.titleField, skipFields: config.skipFields });
      out += "---\n\n";
    }
  }

  return out;
}

// Blog: fetched from external RSS feed
async function blogMd(slug?: string): Promise<string> {
  const res = await fetch("https://blog.tetraslam.world/rss", {
    next: { revalidate: 300 },
  });

  if (!res.ok) return `# blog\n\nFailed to fetch posts.\n`;

  const xml = await res.text();
  const posts = parseAtomEntries(xml);

  if (slug) {
    const post = posts.find((p) => p.slug === slug);
    if (!post) return `# Post not found\n\nNo post with slug \`${slug}\`.\n`;

    let out = `# ${post.title}\n\n`;
    out += `- **Published**: ${new Date(post.published).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}\n`;
    out += `- **Original**: ${post.link}\n\n`;
    if (post.content) {
      out += stripHtml(post.content);
    } else if (post.summary) {
      out += post.summary;
    }
    return out + "\n";
  }

  let out = `# blog — thoughts, notes, and ramblings\n\n`;
  out += `> ${posts.length} posts on [tetraslam.world/blog](${SITE_URL}/blog)\n`;
  out += `> Posts from [blog.tetraslam.world](https://blog.tetraslam.world)\n\n`;

  for (const post of posts) {
    out += `## ${post.title}\n\n`;
    out += `- **Published**: ${new Date(post.published).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}\n`;
    out += `- **Read**: [${SITE_URL}/blog/${post.slug}](${SITE_URL}/blog/${post.slug})\n`;
    out += `- **Markdown**: [${SITE_URL}/blog/${post.slug}.md](${SITE_URL}/blog/${post.slug}.md)\n`;
    if (post.summary) out += `\n${post.summary}\n`;
    out += "\n";
  }
  return out;
}

function parseAtomEntries(xml: string): { slug: string; title: string; link: string; published: string; summary?: string; content?: string }[] {
  const posts: { slug: string; title: string; link: string; published: string; summary?: string; content?: string }[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match: RegExpExecArray | null;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    const extract = (tag: string) => {
      const m = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
      return m ? m[1].trim() : null;
    };
    const decode = (t: string) => t.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");

    const id = extract("id") || "";
    const title = decode(extract("title") || "Untitled");
    const published = extract("published") || extract("updated") || "";
    const summary = extract("summary");
    const content = extract("content");
    const linkMatch = entry.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/);
    const link = linkMatch ? linkMatch[1] : id;

    let slug = id;
    try { slug = new URL(id).pathname.replace(/^\//, ""); } catch { slug = id.split("/").pop() || id; }

    posts.push({
      slug, title, link, published,
      summary: summary ? decode(summary) : undefined,
      content: content ? decode(content) : undefined,
    });
  }

  posts.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
  return posts;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const page = path[0];

  // WET_MODE.md: a single editable markdown blob (not a collection)
  if (page === "WET_MODE") {
    const doc = await fetchQuery(api.wetMode.get, {});
    return mdResponse(doc?.content ?? "");
  }

  // Blog routes: /blog.md and /blog/{slug}.md
  if (page === "blog") {
    const slug = path.length > 1 ? path.slice(1).join("/") : undefined;
    const content = await blogMd(slug);
    return mdResponse(content);
  }

  const config = pages[page];
  if (!config) {
    return mdResponse(
      `# 404\n\nPage \`/${path.join("/")}\` not found.\n\nAvailable pages: /taste, /work, /media, /links, /friends, /gallery, /travel, /blog\n\nSee [/llms.txt](${SITE_URL}/llms.txt) for a full directory.`
    );
  }

  const content = await generatePageMd(config);
  return mdResponse(content);
}
