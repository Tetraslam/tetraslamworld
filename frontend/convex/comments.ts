import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByPost = query({
  args: { postUrl: v.string() },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postUrl", args.postUrl))
      .collect();

    // Fetch user info for each comment
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          username: user?.username ?? "Unknown",
        };
      })
    );

    return commentsWithUsers;
  },
});

export const create = mutation({
  args: {
    postUrl: v.string(),
    userId: v.id("users"),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("comments", {
      postUrl: args.postUrl,
      userId: args.userId,
      content: args.content,
      createdAt: Date.now(),
      parentId: args.parentId,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("comments"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.id);
    if (!comment) {
      throw new Error("Comment not found");
    }
    if (comment.userId !== args.userId) {
      throw new Error("Not authorized to delete this comment");
    }
    await ctx.db.delete(args.id);
  },
});

export const update = mutation({
  args: { id: v.id("comments"), userId: v.id("users"), content: v.string() },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.id);
    if (!comment) {
      throw new Error("Comment not found");
    }
    if (comment.userId !== args.userId) {
      throw new Error("Not authorized to edit this comment");
    }
    await ctx.db.patch(args.id, { content: args.content });
  },
});
