import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: "Invalid URL protocol" },
        { status: 400 },
      );
    }

    // Use Microlink API to capture screenshot
    // embed=screenshot.url returns the raw image directly
    const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&colorScheme=dark`;

    const response = await fetch(microlinkUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ScreenshotCapture/1.0)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Screenshot capture failed: ${response.status}` },
        { status: 502 },
      );
    }

    const contentType = response.headers.get("content-type");
    const blob = await response.blob();

    return new NextResponse(blob, {
      headers: {
        "Content-Type": contentType || "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Screenshot capture error:", error);
    return NextResponse.json(
      { error: "Failed to capture screenshot" },
      { status: 500 },
    );
  }
}
