import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const mediaType = v.union(
  v.literal("anime"),
  v.literal("book"),
  v.literal("game"),
  v.literal("music"),
  v.literal("movie"),
  v.literal("show"),
  v.literal("other")
);

export const list = query({
  args: { type: v.optional(mediaType) },
  handler: async (ctx, args) => {
    if (args.type) {
      return await ctx.db
        .query("media")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .collect();
    }
    return await ctx.db.query("media").collect();
  },
});

export const get = query({
  args: { id: v.id("media") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    type: mediaType,
    title: v.string(),
    content: v.optional(v.string()),
    links: v.optional(v.array(v.object({ label: v.string(), url: v.string() }))),
    imageUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("media", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("media"),
    type: v.optional(mediaType),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    links: v.optional(v.array(v.object({ label: v.string(), url: v.string() }))),
    imageUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("media") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
