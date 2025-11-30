import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate a URL for uploading a file
export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		return await ctx.storage.generateUploadUrl();
	},
});

// Get a URL for a stored file
export const getUrl = query({
	args: { storageId: v.id("_storage") },
	handler: async (ctx, args) => {
		return await ctx.storage.getUrl(args.storageId);
	},
});

// Delete a stored file
export const deleteFile = mutation({
	args: { storageId: v.id("_storage") },
	handler: async (ctx, args) => {
		await ctx.storage.delete(args.storageId);
	},
});
