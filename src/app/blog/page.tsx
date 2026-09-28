import { fetchBlogPosts } from "@/lib/blog";
import { BlogClient } from "./blog-client";

export default async function BlogPage() {
  const posts = await fetchBlogPosts();
  return (
    <BlogClient
      initialPosts={posts.map(({ id, slug, title, published, summary }) => ({
        id,
        slug,
        title,
        published,
        summary,
      }))}
    />
  );
}
