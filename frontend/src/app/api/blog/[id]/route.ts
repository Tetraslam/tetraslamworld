import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const slug = decodeURIComponent(id);

	try {
		const res = await fetch("https://blog.tetraslam.world/rss", {
			next: { revalidate: 300 },
		});

		if (!res.ok) {
			throw new Error("Failed to fetch RSS feed");
		}

		const xml = await res.text();
		const post = findPostBySlug(xml, slug);

		if (!post) {
			return NextResponse.json({ post: null }, { status: 404 });
		}

		return NextResponse.json({ post });
	} catch (error) {
		console.error("Error fetching post:", error);
		return NextResponse.json({ post: null }, { status: 500 });
	}
}

function findPostBySlug(xml: string, targetSlug: string) {
	const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
	let match;

	while ((match = entryRegex.exec(xml)) !== null) {
		const entry = match[1];

		const idMatch = entry.match(/<id>([^<]+)<\/id>/);
		const id = idMatch ? idMatch[1].trim() : "";

		// Extract slug from the id URL
		let slug = id;
		try {
			const url = new URL(id);
			slug = url.pathname.replace(/^\//, "");
		} catch {
			slug = id.split("/").pop() || id;
		}

		if (slug === targetSlug) {
			const titleMatch = entry.match(/<title[^>]*>([^<]+)<\/title>/);
			const title = titleMatch ? titleMatch[1].trim() : "Untitled";

			const publishedMatch =
				entry.match(/<published>([^<]+)<\/published>/) ||
				entry.match(/<updated>([^<]+)<\/updated>/);
			const published = publishedMatch ? publishedMatch[1].trim() : "";

			const linkMatch = entry.match(/<link[^>]*href="([^"]+)"[^>]*>/);
			const link = linkMatch ? linkMatch[1] : id;

			const contentMatch = entry.match(/<content[^>]*>([\s\S]*?)<\/content>/);
			let content = contentMatch ? contentMatch[1].trim() : "";

			// Decode HTML entities
			content = decodeHtml(content);

			// Fix relative URLs to point to blog.tetraslam.world
			content = content.replaceAll('src="/', 'src="https://blog.tetraslam.world/');
			content = content.replaceAll("src='/", "src='https://blog.tetraslam.world/");
			content = content.replaceAll('href="/', 'href="https://blog.tetraslam.world/');
			content = content.replaceAll("href='/", "href='https://blog.tetraslam.world/");

			return { id, slug, title: decodeHtml(title), link, published, content };
		}
	}

	return null;
}

function decodeHtml(text: string): string {
	return text
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&#34;/g, '"')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&apos;/g, "'")
		.replace(/&#xA;/g, "\n")
		.replace(/&amp;/g, "&");
}
