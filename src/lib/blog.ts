/**
 * Blog feed fetching + Atom parsing, shared by the /api/blog route and
 * server components (homepage foyer).
 */

export interface AtomEntry {
  id: string;
  slug: string;
  title: string;
  link: string;
  published: string;
  summary?: string;
  content?: string;
}

export async function fetchBlogPosts(): Promise<AtomEntry[]> {
  const res = await fetch("https://blog.tetraslam.world/rss", {
    next: { revalidate: 300 }, // cache for 5 minutes
  });

  if (!res.ok) {
    throw new Error("Failed to fetch RSS feed");
  }

  const xml = await res.text();
  return parseAtomFeed(xml);
}

export function parseAtomFeed(xml: string): AtomEntry[] {
  const posts: AtomEntry[] = [];

	// Simple regex parsing for Atom feed
	const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;

	for (const match of xml.matchAll(entryRegex)) {
		const entry = match[1];

    const id = extractTag(entry, "id") || "";
    const title = extractTag(entry, "title") || "Untitled";
    const published =
      extractTag(entry, "published") || extractTag(entry, "updated") || "";
    const summary = extractTag(entry, "summary");
    const content = extractTag(entry, "content");

    // Get link href
    const linkMatch = entry.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/);
    const link = linkMatch ? linkMatch[1] : id;

    // Extract slug from the id URL
    let slug = id;
    try {
      const url = new URL(id);
      slug = url.pathname.replace(/^\//, "");
    } catch {
      slug = id.split("/").pop() || id;
    }

    posts.push({
      id,
      slug,
      title: decodeHtmlEntities(title),
      link,
      published,
      summary: summary ? decodeHtmlEntities(summary) : undefined,
      content: content ? decodeHtmlEntities(content) : undefined,
    });
  }

  // Sort by date descending
  posts.sort(
    (a, b) => new Date(b.published).getTime() - new Date(a.published).getTime(),
  );

  return posts;
}

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}
