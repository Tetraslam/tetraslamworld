import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret");
  const envSecret = process.env.REVALIDATE_SECRET;

  // If secret is configured, require it
  if (envSecret && secret !== envSecret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  revalidatePath("/api/blog");
  revalidatePath("/blog");

  return NextResponse.json({ revalidated: true, timestamp: Date.now() });
}
