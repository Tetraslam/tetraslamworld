import { auth } from "@clerk/nextjs/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { ZodError } from "zod";
import { isAdminUser } from "../admin";
import { GithubWritingGit, WritingError } from "./git";
import { WritingService } from "./service";

export const writingService = new WritingService(new GithubWritingGit());
export async function writingAdmin(request?: Request) {
  if (!isAdminUser((await auth()).userId))
    throw new WritingError(
      "UNAUTHORIZED",
      "Sign in as the site owner to use the writing studio.",
      403,
    );
  if (
    request &&
    request.method !== "GET" &&
    request.headers.get("origin") !== new URL(request.url).origin
  )
    throw new WritingError(
      "INVALID_ORIGIN",
      "This request did not come from the writing studio.",
      403,
    );
}
export async function writingBody(request: Request) {
  const body = await request.text();
  if (body.length > 2_000_000)
    throw new WritingError("TOO_LARGE", "This document is too large.", 413);
  return JSON.parse(body);
}
export function invalidateWriting() {
  revalidateTag("writing-public", { expire: 0 });
  revalidatePath("/blog", "layout");
  revalidatePath("/api/blog");
  revalidatePath("/rss.xml");
  revalidatePath("/sitemap.xml");
  revalidatePath("/");
}
export async function writingResponse(action: () => Promise<unknown>) {
  try {
    return Response.json(await action(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof WritingError)
      return Response.json(
        { error: error.code, message: error.message },
        { status: error.status, headers: { "Cache-Control": "no-store" } },
      );
    if (error instanceof ZodError)
      return Response.json(
        {
          error: "INVALID_INPUT",
          message: error.issues
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join("; "),
        },
        { status: 400 },
      );
    console.error(
      "Writing request failed",
      error instanceof Error ? error.name : "unknown",
    );
    return Response.json(
      {
        error: "UNAVAILABLE",
        message:
          "The request could not finish. Your local draft is retained; please retry.",
      },
      { status: 503 },
    );
  }
}
