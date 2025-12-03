import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { status: v.optional(v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected"))) },
  handler: async (ctx, args) => {

    if (args.status !== undefined) {

      const status = args.status;

      return await ctx.db

        .query("linkSuggestions")

        .withIndex("by_status", (q) => q.eq("status", status))

        .collect();
    }
    return await ctx.db.query("linkSuggestions").collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    url: v.string(),
    reason: v.optional(v.string()),
    submitterName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("linkSuggestions", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("linkSuggestions"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const remove = mutation({
  args: { id: v.id("linkSuggestions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
