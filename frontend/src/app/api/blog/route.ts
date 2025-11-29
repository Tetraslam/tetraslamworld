import { NextResponse } from "next/server";

interface AtomEntry {
  id: string;
  title: string;
  link: string;
  published: string;
  summary?: string;
  content?: string;
}

export async function GET() {
  try {
    const res = await fetch("https://blog.tetraslam.world/rss", {
      next: { revalidate: 300 }, // cache for 5 minutes
    });

    if (!res.ok) {
      throw new Error("Failed to fetch RSS feed");
    }

    const xml = await res.text();
    const posts = parseAtomFeed(xml);

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching blog:", error);
    return NextResponse.json({ posts: [], error: "Failed to fetch posts" }, { status: 500 });
  }
}

function parseAtomFeed(xml: string): AtomEntry[] {
  const posts: AtomEntry[] = [];

  // Simple regex parsing for Atom feed
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];

    const id = extractTag(entry, "id") || "";
    const title = extractTag(entry, "title") || "Untitled";
    const published = extractTag(entry, "published") || extractTag(entry, "updated") || "";
    const summary = extractTag(entry, "summary");
    const content = extractTag(entry, "content");

    // Get link href
    const linkMatch = entry.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/);
    const link = linkMatch ? linkMatch[1] : id;

    posts.push({
      id,
      title: decodeHtmlEntities(title),
      link,
      published,
      summary: summary ? decodeHtmlEntities(summary) : undefined,
      content: content ? decodeHtmlEntities(content) : undefined,
    });
  }

  // Sort by date descending
  posts.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());

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
