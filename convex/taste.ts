import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("taste").collect();
  },
});

export const get = query({
  args: { id: v.id("taste") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    url: v.string(),
    content: v.optional(v.string()),
    designNotes: v.optional(v.string()),
    screenshotUrls: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // New items get prepended (lowest order)
    const all = await ctx.db.query("taste").collect();
    const minOrder = all.reduce(
      (min, item) => Math.min(min, item.order ?? 0),
      0,
    );

    return await ctx.db.insert("taste", {
      ...args,
      createdAt: Date.now(),
      order: minOrder - 1,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("taste"),
    title: v.optional(v.string()),
    url: v.optional(v.string()),
    content: v.optional(v.string()),
    designNotes: v.optional(v.string()),
    screenshotUrls: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("taste") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const reorder = mutation({
  args: {
    ids: v.array(v.id("taste")),
  },
  handler: async (ctx, args) => {
    await Promise.all(
      args.ids.map((id, index) => ctx.db.patch(id, { order: index })),
    );
  },
});
