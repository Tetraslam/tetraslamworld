import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
  },
});

export const create = mutation({
  args: { clerkId: v.string(), username: v.string() },
  handler: async (ctx, args) => {
    // Check if username is taken
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    if (existing) {
      throw new Error("Username already taken");
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      username: args.username,
      createdAt: Date.now(),
    });
  },
});

export const getOrCreate = mutation({
  args: { clerkId: v.string(), username: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Check if user exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      return existing;
    }

    // Create new user with provided username or generate one
    const username = args.username || `user_${args.clerkId.slice(-8)}`;
    
    // Make sure username is unique
    let finalUsername = username;
    let counter = 1;
    while (true) {
      const taken = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", finalUsername))
        .unique();
      if (!taken) break;
      finalUsername = `${username}_${counter}`;
      counter++;
    }

    const id = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      username: finalUsername,
      createdAt: Date.now(),
    });

    return await ctx.db.get(id);
  },
});

export const updateUsername = mutation({
  args: { clerkId: v.string(), username: v.string() },
  handler: async (ctx, args) => {
    // Check if username is taken by someone else
    const existingUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    if (existingUsername && existingUsername._id !== user._id) {
      throw new Error("Username already taken");
    }

    await ctx.db.patch(user._id, { username: args.username });
    return user._id;
  },
});
