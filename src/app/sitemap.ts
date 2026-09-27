import { fetchQuery } from "convex/nextjs";
import type { MetadataRoute } from "next";
import { fetchBlogPosts } from "@/lib/blog";
import { api } from "../../convex/_generated/api";
import { tasteKey } from "../../shared/taste";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://tetraslam.world";
  const routes = [
    "",
    "/work",
    "/blog",
    "/friends",
    "/media",
    "/links",
    "/taste",
    "/travel",
    "/gallery",
    "/pixels",
  ];
  const result: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${base}${route}`,
    changeFrequency: route ? "monthly" : "weekly",
    priority: route ? 0.8 : 1,
  }));
  try {
    const posts = await fetchBlogPosts();
    result.push(
      ...posts.map((post) => ({
        url: `${base}/blog/${encodeURIComponent(post.slug)}`,
        lastModified: new Date(post.published),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    );
  } catch (error) {
    console.error("Blog sitemap unavailable", error);
  }
  try {
    const entries = await fetchQuery(api.taste.list, {});
    result.push(
      ...entries.map((item) => ({
        url: `${base}/taste/${encodeURIComponent(tasteKey(item))}`,
        lastModified: new Date(item.updatedAt ?? item.createdAt),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    );
  } catch (error) {
    console.error("Taste sitemap unavailable", error);
  }
  return result;
}
