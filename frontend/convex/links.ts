import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { pinnedOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.pinnedOnly) {
      return await ctx.db
        .query("links")
        .withIndex("by_pinned", (q) => q.eq("pinned", true))
        .collect();
    }
    return await ctx.db.query("links").collect();
  },
});

export const get = query({
  args: { id: v.id("links") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    url: v.string(),
    content: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    pinned: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("links", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("links"),
    title: v.optional(v.string()),
    url: v.optional(v.string()),
    content: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    pinned: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("links") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
