import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
	handler: async (ctx) => {
		return await ctx.db.query("gallery").collect();
	},
});

export const create = mutation({
	args: {
		imageUrl: v.string(),
		caption: v.optional(v.string()),
		order: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("gallery", {
			imageUrl: args.imageUrl,
			caption: args.caption,
			order: args.order ?? 0,
			createdAt: Date.now(),
		});
	},
});

export const update = mutation({
	args: {
		id: v.id("gallery"),
		imageUrl: v.optional(v.string()),
		caption: v.optional(v.string()),
		order: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		await ctx.db.patch(id, updates);
	},
});

export const remove = mutation({
	args: { id: v.id("gallery") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
});

export const reorder = mutation({
	args: { orderedIds: v.array(v.id("gallery")) },
	handler: async (ctx, args) => {
		for (let i = 0; i < args.orderedIds.length; i++) {
			await ctx.db.patch(args.orderedIds[i], { order: i });
		}
	},
});
