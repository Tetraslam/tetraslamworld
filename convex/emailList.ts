import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("emailList").order("desc").collect();
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
    await ctx.db.delete(args.id);
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("emailList").collect();
    for (const email of all) {
      await ctx.db.delete(email._id);
    }
    return all.length;
  },
});
