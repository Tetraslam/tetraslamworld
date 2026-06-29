import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users for comment authentication
  users: defineTable({
    clerkId: v.string(),
    username: v.string(),
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_username", ["username"]),

  // Blog comments
  comments: defineTable({
    postUrl: v.string(),
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
    parentId: v.optional(v.id("comments")),
  })
    .index("by_post", ["postUrl"])
    .index("by_user", ["userId"]),

  // Work items (projects, papers, talks, jobs)
  work: defineTable({
    type: v.union(
      v.literal("project"),
      v.literal("paper"),
      v.literal("talk"),
      v.literal("job"),
      v.literal("other"),
    ),
    title: v.string(),
    content: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    date: v.optional(v.string()),
    endDate: v.optional(v.string()),
    links: v.optional(
      v.array(v.object({ label: v.string(), url: v.string() })),
    ),
    imageUrl: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    order: v.optional(v.number()),
  }).index("by_type", ["type"]),

  // Friends
  friends: defineTable({
    name: v.string(),
    content: v.optional(v.string()),
    links: v.optional(
      v.array(v.object({ label: v.string(), url: v.string() })),
    ),
    imageUrl: v.optional(v.string()),
    order: v.optional(v.number()),
  }),

  // Media (anime, books, games, etc.)
  media: defineTable({
    type: v.union(
      v.literal("anime"),
      v.literal("manga"),
      v.literal("book"),
      v.literal("game"),
      v.literal("music"),
      v.literal("movie"),
      v.literal("show"),
      v.literal("other"),
    ),
    title: v.string(),
    content: v.optional(v.string()),
    links: v.optional(
      v.array(v.object({ label: v.string(), url: v.string() })),
    ),
    imageUrl: v.optional(v.string()), // Legacy single image
    imageUrls: v.optional(v.array(v.string())), // Multiple images (ordered)
    tags: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
    // For anime/manga crossover entries
    showInBoth: v.optional(v.boolean()), // If true, show in both anime and manga
    altImageOrder: v.optional(v.array(v.number())), // Image indices for the alternate section
    altOrder: v.optional(v.number()), // Order in the alternate section
  }).index("by_type", ["type"]),

  // Links (bookmarks)
  links: defineTable({
    title: v.string(),
    url: v.string(),
    content: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    pinned: v.optional(v.boolean()),
    createdAt: v.number(),
    order: v.optional(v.number()),
    fromSuggestionId: v.optional(v.id("linkSuggestions")), // Track if created from suggestion
  }).index("by_pinned", ["pinned"]),

  // Link suggestions from visitors
  linkSuggestions: defineTable({
    title: v.string(),
    url: v.string(),
    reason: v.optional(v.string()),
    submitterName: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
    ),
    createdAt: v.number(),
  }).index("by_status", ["status"]),

  // Travel locations
  travel: defineTable({
    location: v.string(),
    coordinates: v.object({ lat: v.number(), lng: v.number() }),
    dates: v.optional(
      v.object({ start: v.optional(v.string()), end: v.optional(v.string()) }),
    ),
    content: v.optional(v.string()),
    photos: v.optional(v.array(v.id("_storage"))), // Legacy storage IDs
    photoUrls: v.optional(v.array(v.string())), // Direct URLs for gallery
    order: v.optional(v.number()),
  }),

  // Pixel board
  pixelBoard: defineTable({
    x: v.number(),
    y: v.number(),
    color: v.string(),
    clerkId: v.optional(v.string()),
    placedAt: v.number(),
  }).index("by_position", ["x", "y"]),

  // Gallery images
  gallery: defineTable({
    imageUrl: v.string(),
    caption: v.optional(v.string()),
    order: v.optional(v.number()),
    createdAt: v.number(),
  }),

  // Taste (design inspiration board)
  taste: defineTable({
    title: v.string(),
    url: v.string(),
    content: v.optional(v.string()), // Human description (markdown)
    designNotes: v.optional(v.string()), // Agent-focused design notes (markdown)
    screenshotUrls: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_order", ["order"]),

  // Email list
  emailList: defineTable({
    email: v.string(),
    addedAt: v.number(),
  }).index("by_email", ["email"]),

  // WET_MODE.md (single editable text blob)
  wetMode: defineTable({
    content: v.string(),
    updatedAt: v.number(),
  }),
});
