import { createHmac, timingSafeEqual } from "node:crypto";
import { invalidateWriting } from "@/lib/writing/server";
export async function POST(request: Request) {
  const secret = process.env.WRITING_WEBHOOK_SECRET;
  if (!secret) return new Response("Unavailable", { status: 503 });
  const body = await request.text();
  if (body.length > 2_000_000)
    return new Response("Too large", { status: 413 });
  const supplied = Buffer.from(
    request.headers.get("x-hub-signature-256") || "",
  );
  const expected = Buffer.from(
    `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`,
  );
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  )
    return new Response("Unauthorized", { status: 403 });
  const payload = JSON.parse(body);
  if (payload.repository?.full_name !== process.env.WRITING_REPOSITORY)
    return new Response("Ignored", { status: 200 });
  if (payload.ref === `refs/heads/${process.env.WRITING_BRANCH || "main"}`)
    invalidateWriting();
  return Response.json({ ok: true });
}
