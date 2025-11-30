import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, query } from "./_generated/server";

// Helper to check if URL is already on Convex storage
function isConvexUrl(url: string): boolean {
	return url.includes(".convex.cloud") || url.includes("convex.site");
}

// Get all external image URLs that need migration
export const getExternalImages = query({
	handler: async (ctx) => {
		const externalImages: {
			table: string;
			id: string;
			field: string;
			url: string;
		}[] = [];

		// Check friends
		const friends = await ctx.db.query("friends").collect();
		for (const friend of friends) {
			if (friend.imageUrl && !isConvexUrl(friend.imageUrl)) {
				externalImages.push({
					table: "friends",
					id: friend._id,
					field: "imageUrl",
					url: friend.imageUrl,
				});
			}
		}

		// Check media
		const media = await ctx.db.query("media").collect();
		for (const item of media) {
			if (item.imageUrl && !isConvexUrl(item.imageUrl)) {
				externalImages.push({
					table: "media",
					id: item._id,
					field: "imageUrl",
					url: item.imageUrl,
				});
			}
		}

		// Check work
		const work = await ctx.db.query("work").collect();
		for (const item of work) {
			if (item.imageUrl && !isConvexUrl(item.imageUrl)) {
				externalImages.push({
					table: "work",
					id: item._id,
					field: "imageUrl",
					url: item.imageUrl,
				});
			}
		}

		// Check travel photoUrls
		const travel = await ctx.db.query("travel").collect();
		for (const item of travel) {
			if (item.photoUrls) {
				for (let i = 0; i < item.photoUrls.length; i++) {
					const url = item.photoUrls[i];
					if (!isConvexUrl(url)) {
						externalImages.push({
							table: "travel",
							id: item._id,
							field: `photoUrls[${i}]`,
							url,
						});
					}
				}
			}
		}

		// Check gallery
		const gallery = await ctx.db.query("gallery").collect();
		for (const item of gallery) {
			if (item.imageUrl && !isConvexUrl(item.imageUrl)) {
				externalImages.push({
					table: "gallery",
					id: item._id,
					field: "imageUrl",
					url: item.imageUrl,
				});
			}
		}

		return externalImages;
	},
});

// Internal mutation to update a single image URL
export const updateImageUrl = internalMutation({
	args: {
		table: v.string(),
		id: v.string(),
		field: v.string(),
		newUrl: v.string(),
	},
	handler: async (ctx, args) => {
		const { id, field, newUrl } = args;
		// Note: table arg is for logging/debugging, actual table is determined by id format

		if (field.startsWith("photoUrls[")) {
			// Handle travel photoUrls array
			const index = parseInt(field.match(/\[(\d+)\]/)?.[1] || "0");
			// biome-ignore lint: dynamic table access requires any
			const item = await ctx.db.get(id as any);
			if (item && "photoUrls" in item && Array.isArray(item.photoUrls)) {
				const newPhotoUrls = [...item.photoUrls];
				newPhotoUrls[index] = newUrl;
				// biome-ignore lint: dynamic table access requires any
				await ctx.db.patch(id as any, { photoUrls: newPhotoUrls });
			}
		} else {
			// Handle simple imageUrl field
			// biome-ignore lint: dynamic table access requires any
			await ctx.db.patch(id as any, { [field]: newUrl });
		}
	},
});

// Action to migrate a single image
export const migrateImage = action({
	args: {
		table: v.string(),
		id: v.string(),
		field: v.string(),
		externalUrl: v.string(),
		proxyBaseUrl: v.optional(v.string()), // No longer used, kept for backwards compat
	},
	handler: async (ctx, args) => {
		const { table, id, field, externalUrl } = args;

		try {
			// Fetch directly from the external URL (no CORS issues in server-side actions)
			const response = await fetch(externalUrl, {
				headers: {
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
					"Accept": "image/*,*/*;q=0.8",
					"Accept-Language": "en-US,en;q=0.9",
					"Referer": new URL(externalUrl).origin,
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
			}

			const blob = await response.blob();
			
			// Verify it's actually an image
			const contentType = response.headers.get("content-type") || blob.type;
			if (!contentType.startsWith("image/")) {
				throw new Error(`Not an image: ${contentType}`);
			}

			// Upload to Convex storage
			const uploadUrl = await ctx.storage.generateUploadUrl();
			const uploadResponse = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": blob.type || "image/jpeg" },
				body: blob,
			});

			if (!uploadResponse.ok) {
				throw new Error("Upload failed");
			}

			const { storageId } = await uploadResponse.json();

			// Get the Convex URL
			const convexUrl = await ctx.storage.getUrl(storageId);

			if (!convexUrl) {
				throw new Error("Could not get storage URL");
			}

			// Update the database
			await ctx.runMutation(internal.imageMigration.updateImageUrl, {
				table,
				id,
				field,
				newUrl: convexUrl,
			});

			return { success: true, newUrl: convexUrl };
		} catch (error) {
			console.error(`Migration failed for ${table}/${id}:`, error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	},
});
