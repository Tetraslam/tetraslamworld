import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAll = query({
  handler: async (ctx) => {
    const pixels = await ctx.db.query("pixelBoard").collect();

    // Fetch usernames for each pixel
    const pixelsWithUsers = await Promise.all(
      pixels.map(async (pixel) => {
        if (pixel.clerkId) {
          const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", pixel.clerkId!))
            .unique();
          return { ...pixel, username: user?.username };
        }
        return pixel;
      })
    );

    return pixelsWithUsers;
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

export const place = mutation({
  args: {
    x: v.number(),
    y: v.number(),
    color: v.string(),
    clerkId: v.string(),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Ensure user exists in users table
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!existingUser) {
      // Create user record
      const baseUsername = args.username || `user_${args.clerkId.slice(-6)}`;
      let username = baseUsername;
      let counter = 1;

      // Ensure unique username
      while (true) {
        const taken = await ctx.db
          .query("users")
          .withIndex("by_username", (q) => q.eq("username", username))
          .unique();
        if (!taken) break;
        username = `${baseUsername}_${counter}`;
        counter++;
      }

      await ctx.db.insert("users", {
        clerkId: args.clerkId,
        username,
        createdAt: Date.now(),
      });
    }

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
