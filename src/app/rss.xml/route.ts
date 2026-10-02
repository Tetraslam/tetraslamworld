import { gitWritingEnabled, writingFeed } from "@/lib/writing/public";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!gitWritingEnabled())
    return Response.redirect("https://blog.tetraslam.world/rss", 307);
  return new Response(await writingFeed(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}
