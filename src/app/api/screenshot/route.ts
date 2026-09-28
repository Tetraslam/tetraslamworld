import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin";

export async function GET(request: NextRequest) {
  if (!isAdminUser((await auth()).userId))
    return NextResponse.json(
      { error: "Administrator access required" },
      { status: 403 },
    );
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
    const theme =
      request.nextUrl.searchParams.get("theme") === "dark" ? "dark" : "light";
    const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&colorScheme=${theme}`;

    const response = await fetch(microlinkUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ScreenshotCapture/1.0)",
      },
      signal: AbortSignal.timeout(30000),
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
