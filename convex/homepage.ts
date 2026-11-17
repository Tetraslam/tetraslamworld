import { ConvexError, v } from "convex/values";
import {
  DEFAULT_HOME,
  HOME_LIMITS,
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
          now: doc.now ?? "",
          nowUpdatedAt: doc.nowUpdatedAt ?? 0,
          revision: doc.revision,
          updatedAt: doc.updatedAt,
        }
      : DEFAULT_HOME;
  },
});

export const save = mutation({
  args: {
    heading: v.string(),
    body: v.string(),
    now: v.optional(v.string()),
    expectedRevision: v.number(),
  },
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
      (args.now ?? "").length > HOME_LIMITS.now ||
      !Number.isInteger(args.expectedRevision) ||
      args.expectedRevision < 0
    ) {
      throw new ConvexError({
        code: "INVALID_CONTENT",
        message:
          "Use a heading of 1–120 characters, a bio of 1–6000 characters, and a now note under 600.",
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
    // Older clients don't send `now`; keep what's saved rather than clearing it.
    const now =
      args.now === undefined ? (existing?.now ?? "") : args.now.trim();
    const nowUpdatedAt =
      now === (existing?.now ?? "")
        ? (existing?.nowUpdatedAt ?? 0)
        : Date.now();
    const content = {
      heading: args.heading.trim(),
      body: args.body.trim(),
      now,
      nowUpdatedAt,
      revision: args.expectedRevision + 1,
      updatedAt: Date.now(),
    };
    if (existing) await ctx.db.patch(existing._id, content);
    else await ctx.db.insert("siteContent", { key: "home", ...content });
    return content;
  },
});
