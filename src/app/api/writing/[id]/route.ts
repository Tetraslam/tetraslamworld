import { z } from "zod";
import { WritingError } from "@/lib/writing/git";
import {
  invalidateWriting,
  writingAdmin,
  writingBody,
  writingResponse,
  writingService,
} from "@/lib/writing/server";
import { operationSchema } from "@/lib/writing/service";
import { postSchema } from "../../../../../shared/writing";

type Context = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(request: Request, { params }: Context) {
  return writingResponse(async () => {
    await writingAdmin();
    const { id } = await params;
    const url = new URL(request.url);
    if (url.searchParams.has("history"))
      return {
        revisions: await writingService.history(
          id,
          z.coerce
            .number()
            .int()
            .min(1)
            .max(10000)
            .parse(url.searchParams.get("page") || 1),
        ),
      };
    if (url.searchParams.has("publications"))
      return { events: await writingService.publications(id) };
    const publication = url.searchParams.get("publication");
    if (publication) return writingService.publishedRevision(id, publication);
    const revision = url.searchParams.get("revision");
    return revision
      ? writingService.revision(id, revision)
      : writingService.readDraft(id);
  });
}
export async function POST(request: Request, { params }: Context) {
  return writingResponse(async () => {
    await writingAdmin(request);
    const { id } = await params;
    const body = await writingBody(request);
    const base = operationSchema.parse({ ...body, id });
    switch (body.action) {
      case "save":
        return writingService.save({
          ...base,
          post: postSchema.parse(body.post),
        });
      case "restore": {
        const old = await writingService.revision(
          id,
          z.string().parse(body.commit),
        );
        return writingService.save({ ...base, post: old.post });
      }
      case "restorePublication": {
        const old = await writingService.publishedRevision(
          id,
          z.string().parse(body.revision),
        );
        return writingService.save({ ...base, post: old.post });
      }
      case "publish": {
        const result = await writingService.publish({
          ...base,
          expectedPublication: z
            .string()
            .nullable()
            .parse(body.expectedPublication),
          at: body.at === undefined ? undefined : z.string().parse(body.at),
        });
        invalidateWriting();
        return result;
      }
      case "unpublish": {
        const result = await writingService.unpublish({
          ...base,
          expectedPublication: z
            .string()
            .nullable()
            .parse(body.expectedPublication),
        });
        invalidateWriting();
        return result;
      }
      case "cancel":
        return writingService.cancelSchedule({
          ...base,
          scheduleId: z.string().uuid().parse(body.scheduleId),
        });
      default:
        throw new WritingError("INVALID_ACTION", "Unknown writing action.");
    }
  });
}
