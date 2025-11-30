import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const url = request.nextUrl.searchParams.get("url");

	if (!url) {
		return NextResponse.json({ error: "URL required" }, { status: 400 });
	}

	try {
		// Validate URL
		const parsedUrl = new URL(url);
		if (!["http:", "https:"].includes(parsedUrl.protocol)) {
			return NextResponse.json(
				{ error: "Invalid URL protocol" },
				{ status: 400 },
			);
		}

		// Fetch the image
		const response = await fetch(url, {
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; ImageProxy/1.0)",
			},
		});

		if (!response.ok) {
			return NextResponse.json(
				{ error: `Failed to fetch image: ${response.status}` },
				{ status: response.status },
			);
		}

		const contentType = response.headers.get("content-type");
		if (!contentType?.startsWith("image/")) {
			return NextResponse.json(
				{ error: "URL does not point to an image" },
				{ status: 400 },
			);
		}

		const blob = await response.blob();

		// Return the image with proper headers
		return new NextResponse(blob, {
			headers: {
				"Content-Type": contentType,
				"Cache-Control": "no-store",
			},
		});
	} catch (error) {
		console.error("Proxy image error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch image" },
			{ status: 500 },
		);
	}
}
