import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("friends").collect();
  },
});

export const get = query({
  args: { id: v.id("friends") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    content: v.optional(v.string()),
    links: v.optional(v.array(v.object({ label: v.string(), url: v.string() }))),
    imageUrl: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("friends", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("friends"),
    name: v.optional(v.string()),
    content: v.optional(v.string()),
    links: v.optional(v.array(v.object({ label: v.string(), url: v.string() }))),
    imageUrl: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("friends") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const reorder = mutation({
  args: {
    orderedIds: v.array(v.id("friends")),
  },
  handler: async (ctx, args) => {
    // Update order field for each item based on position in array
    await Promise.all(
      args.orderedIds.map((id, index) =>
        ctx.db.patch(id, { order: index })
      )
    );
  },
});
