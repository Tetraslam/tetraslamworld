import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { fetchBlogPost } from "@/lib/blog-post";
import { mediaUrl, writingTitle } from "../../../../shared/writing";
import { BlogPostClient } from "./post-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await fetchBlogPost(decodeURIComponent(id));
  return {
    title:
      post && "nativePost" in post
        ? writingTitle(post.nativePost)
        : (post?.title ?? "post not found"),
    description:
      post && "nativePost" in post
        ? post.nativePost.summary || undefined
        : undefined,
    openGraph:
      post && "nativePost" in post && post.nativePost.cover
        ? { images: [mediaUrl(post.nativePost.cover)] }
        : undefined,
    alternates: {
      canonical: `/blog/${encodeURIComponent(post?.slug || id)}`,
      types: {
        "text/markdown": `/blog/${encodeURIComponent(post?.slug || id)}.md`,
      },
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await fetchBlogPost(decodeURIComponent(id));
  if (!post) notFound();
  if ("canonical" in post && post.canonical !== decodeURIComponent(id))
    permanentRedirect(`/blog/${encodeURIComponent(post.canonical)}`);
  return <BlogPostClient key={post.id} post={post} />;
}
