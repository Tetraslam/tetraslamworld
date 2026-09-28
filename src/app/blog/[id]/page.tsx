import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchBlogPost } from "@/lib/blog-post";
import { BlogPostClient } from "./post-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await fetchBlogPost(decodeURIComponent(id));
  return {
    title: post?.title ?? "post not found",
    alternates: { canonical: `/blog/${encodeURIComponent(id)}` },
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
  return <BlogPostClient key={post.id} post={post} />;
}
