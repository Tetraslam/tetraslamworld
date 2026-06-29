import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("wetMode").first();
  },
});

export const set = mutation({
  args: {
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("wetMode").first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        content: args.content,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("wetMode", {
        content: args.content,
        updatedAt: Date.now(),
      });
    }
  },
});
