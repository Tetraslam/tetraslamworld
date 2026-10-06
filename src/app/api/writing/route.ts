import {
  writingAdmin,
  writingResponse,
  writingService,
} from "@/lib/writing/server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return writingResponse(async () => {
    await writingAdmin();
    const q = new URL(request.url).searchParams.get("q")?.slice(0, 200) || "";
    const entries = await writingService.list(q);
    return {
      entries,
      workspace: process.env.WRITING_BRANCH || "main",
      ready: (await writingService.load()).index.migration.verified,
    };
  });
}
