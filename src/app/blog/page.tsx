import { fetchBlogPosts } from "@/lib/blog";
import { BlogClient } from "./blog-client";

// Standalone pages listed alongside posts. They link out by href, so they
// stay out of the feed, the sitemap's post list, and /blog/[id].
const PAGES = [
  {
    id: "page:fast",
    slug: "fast",
    href: "/fast",
    title: "Fast",
    link: "https://www.tetraslam.world/fast",
    published: "2026-11-22",
    summary:
      "Examples of people, and lately models, quickly accomplishing ambitious things in AI.",
  },
];
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
      initialPosts={[
        ...PAGES,
        ...posts.map(({ content: _content, ...post }) => post),
      ]}
      initialFilter={filter}
      native={process.env.WRITING_SOURCE === "git"}
    />
  );
}
