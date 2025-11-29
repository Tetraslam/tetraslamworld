import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const workType = v.union(
  v.literal("project"),
  v.literal("paper"),
  v.literal("talk"),
  v.literal("job"),
  v.literal("other")
);

export const list = query({
  args: { type: v.optional(workType) },
  handler: async (ctx, args) => {
    if (args.type) {
      return await ctx.db
        .query("work")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .collect();
    }
    return await ctx.db.query("work").collect();
  },
});

export const getFeatured = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("work").collect();
    return all.filter((w) => w.featured);
  },
});

export const get = query({
  args: { id: v.id("work") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    type: workType,
    title: v.string(),
    content: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    date: v.optional(v.string()),
    endDate: v.optional(v.string()),
    links: v.optional(v.array(v.object({ label: v.string(), url: v.string() }))),
    imageUrl: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("work", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("work"),
    type: v.optional(workType),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    date: v.optional(v.string()),
    endDate: v.optional(v.string()),
    links: v.optional(v.array(v.object({ label: v.string(), url: v.string() }))),
    imageUrl: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("work") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
