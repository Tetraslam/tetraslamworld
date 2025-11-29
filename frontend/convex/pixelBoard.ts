import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("pixelBoard").collect();
  },
});

export const getPixel = query({
  args: { x: v.number(), y: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pixelBoard")
      .withIndex("by_position", (q) => q.eq("x", args.x).eq("y", args.y))
      .unique();
  },
});

export const placePixel = mutation({
  args: {
    x: v.number(),
    y: v.number(),
    color: v.string(),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if pixel already exists at this position
    const existing = await ctx.db
      .query("pixelBoard")
      .withIndex("by_position", (q) => q.eq("x", args.x).eq("y", args.y))
      .unique();

    if (existing) {
      // Update existing pixel
      await ctx.db.patch(existing._id, {
        color: args.color,
        clerkId: args.clerkId,
        placedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new pixel
    return await ctx.db.insert("pixelBoard", {
      x: args.x,
      y: args.y,
      color: args.color,
      clerkId: args.clerkId,
      placedAt: Date.now(),
    });
  },
});

export const clearBoard = mutation({
  handler: async (ctx) => {
    const all = await ctx.db.query("pixelBoard").collect();
    await Promise.all(all.map((pixel) => ctx.db.delete(pixel._id)));
  },
});
