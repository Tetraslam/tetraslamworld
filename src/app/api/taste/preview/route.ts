import { type NextRequest, NextResponse } from "next/server";
import { getTetrastack } from "@/lib/tetrastack/load";
import { fetchImage, getPreview } from "@/lib/tetrastack/previews";
import { previewCandidates } from "../../../../../shared/tetrastack";

/**
 * Serves the preview image for a source tetrastack links to. Only sources in
 * the current tetrastack are served, so this isn't an open proxy. Images are
 * cached by the CDN for a day and revalidated in the background for a week,
 * so a source that later disappears doesn't break the page right away.
 */
export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("source");
  if (!source)
    return NextResponse.json({ error: "source required" }, { status: 400 });
  const stack = await getTetrastack();
  if (!previewCandidates(stack).includes(source))
    return NextResponse.json(
      { error: "not a tetrastack source" },
      { status: 404 },
    );
  const preview = await getPreview(source);
  if (!preview)
    return NextResponse.json({ error: "no preview" }, { status: 404 });
  try {
    const image = await fetchImage(preview.image);
    return new NextResponse(new Blob([image.bytes as BlobPart]), {
      headers: {
        "Content-Type": image.type,
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        "Content-Security-Policy": "sandbox; script-src 'none'",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "image unavailable" }, { status: 502 });
  }
}
