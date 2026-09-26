import { ConvexError, v } from "convex/values";
import {
  DEFAULT_HOME,
  parseAdminIds,
  validateHomeCopy,
} from "../shared/home-content";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const doc = await ctx.db
      .query("siteContent")
      .withIndex("by_key", (q) => q.eq("key", "home"))
      .unique();
    return doc
      ? {
          heading: doc.heading,
          body: doc.body,
          revision: doc.revision,
          updatedAt: doc.updatedAt,
        }
      : DEFAULT_HOME;
  },
});

export const save = mutation({
  args: { heading: v.string(), body: v.string(), expectedRevision: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (
      !identity ||
      !parseAdminIds(process.env.ADMIN_USER_IDS).includes(identity.subject)
    ) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Only the site administrator can change this copy.",
      });
    }
    if (
      !validateHomeCopy(args.heading, args.body) ||
      !Number.isInteger(args.expectedRevision) ||
      args.expectedRevision < 0
    ) {
      throw new ConvexError({
        code: "INVALID_CONTENT",
        message:
          "Use a heading of 1–120 characters and a bio of 1–6000 characters.",
      });
    }
    const existing = await ctx.db
      .query("siteContent")
      .withIndex("by_key", (q) => q.eq("key", "home"))
      .unique();
    if ((existing?.revision ?? 0) !== args.expectedRevision) {
      throw new ConvexError({
        code: "CONFLICT",
        message:
          "The bio was changed in another session. Review the latest version before saving.",
      });
    }
    const content = {
      heading: args.heading.trim(),
      body: args.body.trim(),
      revision: args.expectedRevision + 1,
      updatedAt: Date.now(),
    };
    if (existing) await ctx.db.patch(existing._id, content);
    else await ctx.db.insert("siteContent", { key: "home", ...content });
    return content;
  },
});
