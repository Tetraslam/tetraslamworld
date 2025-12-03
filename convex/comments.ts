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

// Get paginated top-level comments with their replies
export const getPaginated = query({
  args: {
    postUrl: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()), // createdAt timestamp for cursor-based pagination
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Get all comments for this post
    const allComments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postUrl", args.postUrl))
      .collect();

    // Separate top-level comments and replies
    const topLevel = allComments.filter((c) => !c.parentId);
    const replies = allComments.filter((c) => c.parentId);

    // Sort top-level by createdAt descending (newest first)
    topLevel.sort((a, b) => b.createdAt - a.createdAt);

    // Apply cursor-based pagination to top-level only
    let filteredTopLevel = topLevel;
    if (args.cursor !== undefined) {
      const cursor = args.cursor;
      filteredTopLevel = topLevel.filter((c) => c.createdAt < cursor);
    }

    // Take limit + 1 to check if there are more
    const paginatedTopLevel = filteredTopLevel.slice(0, limit + 1);
    const hasMore = paginatedTopLevel.length > limit;
    const resultTopLevel = paginatedTopLevel.slice(0, limit);

    // Get the IDs of top-level comments we're showing
    const topLevelIds = new Set(resultTopLevel.map((c) => c._id));

    // Find all replies that belong to these top-level comments (recursive)
    const relevantReplies: typeof replies = [];
    const findReplies = (parentIds: Set<string>) => {
      const children = replies.filter((r) => r.parentId && parentIds.has(r.parentId));
      if (children.length > 0) {
        relevantReplies.push(...children);
        findReplies(new Set(children.map((c) => c._id)));
      }
    };
    findReplies(topLevelIds as Set<string>);

    // Combine and fetch user info
    const allRelevant = [...resultTopLevel, ...relevantReplies];
    const commentsWithUsers = await Promise.all(
      allRelevant.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          username: user?.username ?? "Unknown",
        };
      })
    );

    // Next cursor is the createdAt of the last top-level comment
    const nextCursor = resultTopLevel.length > 0
      ? resultTopLevel[resultTopLevel.length - 1].createdAt
      : null;

    return {
      comments: commentsWithUsers,
      nextCursor: hasMore ? nextCursor : null,
      totalTopLevel: topLevel.length,
    };
  },
});

// Get total count for display
export const getCount = query({
  args: { postUrl: v.string() },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postUrl", args.postUrl))
      .collect();
    return comments.length;
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
