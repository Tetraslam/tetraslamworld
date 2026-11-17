import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/admin";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("emailList").order("desc").collect();
  },
});

// Visitors may only ask about their own address; the full list is admin-only.
export const isSubscribed = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!email) return false;
    const existing = await ctx.db
      .query("emailList")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    return !!existing;
  },
});

export const add = mutation({
  args: {
    emails: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const added: string[] = [];
    const skipped: string[] = [];

    for (const email of args.emails) {
      const trimmed = email.trim().toLowerCase();
      if (!trimmed) continue;

      // Check if already exists
      const existing = await ctx.db
        .query("emailList")
        .withIndex("by_email", (q) => q.eq("email", trimmed))
        .first();

      if (existing) {
        skipped.push(trimmed);
      } else {
        await ctx.db.insert("emailList", {
          email: trimmed,
          addedAt: Date.now(),
        });
        added.push(trimmed);
      }
    }

    return { added, skipped };
  },
});

export const remove = mutation({
  args: {
    id: v.id("emailList"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("emailList").collect();
    for (const email of all) {
      await ctx.db.delete(email._id);
    }
    return all.length;
  },
});
