import { gitWritingEnabled, searchPublicWriting } from "@/lib/writing/public";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!gitWritingEnabled()) return Response.json({ items: [] });
  const query = new URL(request.url).searchParams.get("q")?.slice(0, 300) || "";
  return Response.json(
    { items: await searchPublicWriting(query) },
    { headers: { "Cache-Control": "public, max-age=30" } },
  );
}
