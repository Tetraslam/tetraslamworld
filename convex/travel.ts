import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("travel").collect();
  },
});

export const get = query({
  args: { id: v.id("travel") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    location: v.string(),
    coordinates: v.object({ lat: v.number(), lng: v.number() }),
    dates: v.optional(v.object({ start: v.optional(v.string()), end: v.optional(v.string()) })),
    content: v.optional(v.string()),
    photos: v.optional(v.array(v.id("_storage"))),
    photoUrls: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("travel", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("travel"),
    location: v.optional(v.string()),
    coordinates: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    dates: v.optional(v.object({ start: v.optional(v.string()), end: v.optional(v.string()) })),
    content: v.optional(v.string()),
    photos: v.optional(v.array(v.id("_storage"))),
    photoUrls: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("travel") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const reorder = mutation({
  args: {
    orderedIds: v.array(v.id("travel")),
  },
  handler: async (ctx, args) => {
    await Promise.all(
      args.orderedIds.map((id, index) =>
        ctx.db.patch(id, { order: index })
      )
    );
  },
});

// File upload URL generation
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get photo URLs
export const getPhotoUrls = query({
  args: { storageIds: v.array(v.id("_storage")) },
  handler: async (ctx, args) => {
    const urls = await Promise.all(
      args.storageIds.map(async (id) => {
        const url = await ctx.storage.getUrl(id);
        return { id, url };
      })
    );
    return urls;
  },
});
