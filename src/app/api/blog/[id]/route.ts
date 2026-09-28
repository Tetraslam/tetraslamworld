import { NextResponse } from "next/server";
import { fetchBlogPost } from "@/lib/blog-post";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const post = await fetchBlogPost(decodeURIComponent(id));
    return NextResponse.json({ post }, { status: post ? 200 : 404 });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json({ post: null }, { status: 500 });
  }
}
