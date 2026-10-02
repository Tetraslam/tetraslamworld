import { fetchBlogPosts } from "@/lib/blog";
import { BlogClient } from "./blog-client";
export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [posts, query] = await Promise.all([fetchBlogPosts(), searchParams]);
  const value = (key: string) =>
    typeof query[key] === "string" ? (query[key] as string) : "";
  const filter = {
    q: value("q"),
    kind: value("kind"),
    tag: value("tag"),
    topic: value("topic"),
    series: value("series"),
  };
  return (
    <BlogClient
      key={JSON.stringify(filter)}
      initialPosts={posts.map(({ content: _content, ...post }) => post)}
      initialFilter={filter}
      native={process.env.WRITING_SOURCE === "git"}
    />
  );
}
