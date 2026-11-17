import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { TETRASTACK_TAG } from "@/lib/tetrastack/load";

/**
 * Refreshes the taste page now instead of within the hour. Point a GitHub
 * push webhook for tetrastack here (content type application/json, secret
 * TETRASTACK_WEBHOOK_SECRET), or call it by hand with the site's
 * REVALIDATE_SECRET in an x-revalidate-secret header. Without a configured
 * secret it refuses everything.
 */

function same(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const webhookSecret = process.env.TETRASTACK_WEBHOOK_SECRET;
  const manualSecret = process.env.REVALIDATE_SECRET;
  const fromGitHub =
    !!signature &&
    !!webhookSecret &&
    same(
      signature,
      `sha256=${createHmac("sha256", webhookSecret).update(body).digest("hex")}`,
    );
  const byHand =
    !!manualSecret &&
    same(request.headers.get("x-revalidate-secret") ?? "", manualSecret);
  if (!fromGitHub && !byHand)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (request.headers.get("x-github-event") === "ping")
    return NextResponse.json({ ok: true });
  revalidateTag(TETRASTACK_TAG, { expire: 0 });
  revalidatePath("/taste", "layout");
  revalidatePath("/api/md/taste", "layout");
  return NextResponse.json({ revalidated: true, at: Date.now() });
}
