import { auth } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin";
import { publicWritingAsset } from "@/lib/writing/public";
import { writingService } from "@/lib/writing/server";
import { originalUrl } from "@/lib/writing/storage";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[a-f0-9]{64}$/.test(id))
    return new Response("Not found", { status: 404 });
  let asset =
    process.env.WRITING_SOURCE === "git"
      ? await publicWritingAsset(id)
      : undefined;
  const released = !!asset;
  if (!asset && isAdminUser((await auth()).userId))
    asset = (await writingService.load()).index.assets[id];
  if (!asset)
    return new Response("Not found", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  return new Response(null, {
    status: 307,
    headers: {
      Location: await originalUrl(asset),
      "Cache-Control": released ? "public, max-age=60" : "private, no-store",
    },
  });
}
