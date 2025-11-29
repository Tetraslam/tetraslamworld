import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const postId = decodeURIComponent(id);

  try {
    const res = await fetch("https://blog.tetraslam.world/rss", {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch RSS feed");
    }

    const xml = await res.text();
    const post = findPostById(xml, postId);

    if (!post) {
      return NextResponse.json({ post: null, error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json({ post: null, error: "Failed to fetch post" }, { status: 500 });
  }
}

function findPostById(xml: string, targetId: string) {
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    const id = extractTag(entry, "id") || "";

    if (id === targetId) {
      const title = extractTag(entry, "title") || "Untitled";
      const published = extractTag(entry, "published") || extractTag(entry, "updated") || "";
      const content = extractTag(entry, "content");

      const linkMatch = entry.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/);
      const link = linkMatch ? linkMatch[1] : id;

      return {
        id,
        title: decodeHtmlEntities(title),
        link,
        published,
        content: content ? decodeHtmlEntities(content) : undefined,
      };
    }
  }

  return null;
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
