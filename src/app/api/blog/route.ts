import { NextResponse } from "next/server";
import { fetchBlogPosts } from "@/lib/blog";

export async function GET() {
	try {
		const posts = await fetchBlogPosts();
		return NextResponse.json({ posts });
	} catch (error) {
		console.error("Error fetching blog:", error);
		return NextResponse.json(
			{ posts: [], error: "Failed to fetch posts" },
			{ status: 500 },
		);
	}
}
