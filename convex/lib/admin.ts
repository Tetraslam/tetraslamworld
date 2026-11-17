import { ConvexError } from "convex/values";
import { parseAdminIds } from "../../shared/home-content";
import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";

type AuthCtx = Pick<QueryCtx | MutationCtx | ActionCtx, "auth">;

export async function isAdmin(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity();
  return (
    !!identity &&
    parseAdminIds(process.env.ADMIN_USER_IDS).includes(identity.subject)
  );
}

// Every content write goes through the owner. The admin UI hides these
// controls from visitors, but Convex functions are public endpoints.
export async function requireAdmin(ctx: AuthCtx) {
  if (!(await isAdmin(ctx)))
    throw new ConvexError({
      code: "UNAUTHORIZED",
      message: "Administrator access is required.",
    });
}
