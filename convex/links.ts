import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { pinnedOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.pinnedOnly) {
      return await ctx.db
        .query("links")
        .withIndex("by_pinned", (q) => q.eq("pinned", true))
        .collect();
    }
    return await ctx.db.query("links").collect();
  },
});

export const get = query({
  args: { id: v.id("links") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    url: v.string(),
    content: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    pinned: v.optional(v.boolean()),
    fromSuggestionId: v.optional(v.id("linkSuggestions")),
  },
  handler: async (ctx, args) => {
    // Get min order to prepend at the beginning (new links appear first)
    const allLinks = await ctx.db.query("links").collect();
    const minOrder = allLinks.reduce(
      (min, link) => Math.min(min, link.order ?? 0),
      0
    );
    
    // If from a suggestion, mark it as accepted
    if (args.fromSuggestionId) {
      await ctx.db.patch(args.fromSuggestionId, { status: "accepted" });
    }
    
    return await ctx.db.insert("links", {
      ...args,
      createdAt: Date.now(),
      order: minOrder - 1,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("links"),
    title: v.optional(v.string()),
    url: v.optional(v.string()),
    content: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    pinned: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("links") },
  handler: async (ctx, args) => {
    // Get the link first to check if it came from a suggestion
    const link = await ctx.db.get(args.id);
    if (link?.fromSuggestionId) {
      // Mark the source suggestion as rejected since the link is being deleted
      const suggestion = await ctx.db.get(link.fromSuggestionId);
      if (suggestion) {
        await ctx.db.patch(link.fromSuggestionId, { status: "rejected" });
      }
    }
    await ctx.db.delete(args.id);
  },
});

export const reorder = mutation({
  args: {
    ids: v.array(v.id("links")),
  },
  handler: async (ctx, args) => {
    await Promise.all(
      args.ids.map((id, index) => ctx.db.patch(id, { order: index }))
    );
  },
});
