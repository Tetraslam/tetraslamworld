import { ConvexError, v } from "convex/values";
import { parseAdminIds } from "../shared/home-content";
import {
  emptyTasteDraft,
  slugify,
  TASTE_LIMITS,
  type TasteDraft,
  toTasteDraft,
  validateTaste,
} from "../shared/taste";
import {
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";
import { tasteDraft } from "./tasteFields";

async function admin(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (
    !identity ||
    !parseAdminIds(process.env.ADMIN_USER_IDS).includes(identity.subject)
  )
    throw new ConvexError({
      code: "UNAUTHORIZED",
      message: "Administrator access is required.",
    });
}
function fail(message: string, code = "INVALID_CONTENT"): never {
  throw new ConvexError({ code, message });
}
async function prepare(ctx: MutationCtx, input: TasteDraft) {
  const error = validateTaste(input);
  if (error) fail(error);
  const media = await Promise.all(
    input.media.map(async (asset) => {
      const result = { ...asset };
      if (asset.storageId) {
        if (!["image", "video", "audio"].includes(asset.kind))
          fail("This kind of item cannot use an uploaded file.");
        const file = await ctx.db.system.get("_storage", asset.storageId);
        if (
          !file ||
          file.size > TASTE_LIMITS.fileBytes ||
          !file.contentType?.startsWith(`${asset.kind}/`)
        )
          fail(
            "The uploaded file is missing, too large, or has the wrong media type.",
          );
        const url = await ctx.storage.getUrl(asset.storageId);
        if (!url) fail("The uploaded file is unavailable.");
        result.url = url;
        if (file.contentType === "image/gif") result.animated = true;
      }
      if (asset.posterStorageId) {
        const file = await ctx.db.system.get("_storage", asset.posterStorageId);
        if (
          !file ||
          file.size > TASTE_LIMITS.fileBytes ||
          !file.contentType?.startsWith("image/")
        )
          fail("The poster must be an image.");
        const url = await ctx.storage.getUrl(asset.posterStorageId);
        if (!url) fail("The poster is unavailable.");
        result.poster = url;
      }
      return result;
    }),
  );
  return {
    ...input,
    title: input.title.trim(),
    url: input.url.trim(),
    categories: [
      ...new Set(
        input.categories.map((value) => value.trim().toLocaleLowerCase()),
      ),
    ],
    qualities: [
      ...new Set(
        input.qualities.map((value) => value.trim().toLocaleLowerCase()),
      ),
    ],
    tags: [...new Set(input.tags.map((value) => value.trim()))],
    media,
    // Older clients still get a useful static representation during rollout.
    screenshotUrls: media.flatMap((asset) =>
      asset.kind === "image" && !asset.animated && asset.url
        ? [asset.url]
        : asset.poster
          ? [asset.poster]
          : [],
    ),
  };
}
async function uniqueSlug(ctx: MutationCtx, title: string) {
  const base = slugify(title);
  for (let n = 1; n <= 100; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    if (
      !(await ctx.db
        .query("taste")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique())
    )
      return slug;
  }
  fail("Please choose a more specific title.");
}
function checkRevision(actual: number | undefined, expected: number) {
  if (!Number.isInteger(expected) || expected < 0)
    fail("The entry version is invalid.");
  if ((actual ?? 0) !== expected)
    fail(
      "This entry changed in another session. Your draft is kept; reload the saved version before trying again.",
      "CONFLICT",
    );
}

export const list = query({
  args: {},
  handler: async (ctx) =>
    (await ctx.db.query("taste").collect()).filter(
      (item) => item.published !== false,
    ),
});
export const adminList = query({
  args: {},
  handler: async (ctx) => {
    await admin(ctx);
    return await ctx.db.query("taste").collect();
  },
});
export const get = query({
  args: { id: v.id("taste") },
  handler: async (ctx, { id }) => {
    const doc = await ctx.db.get("taste", id);
    return doc?.published === false ? null : doc;
  },
});
export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const id = ctx.db.normalizeId("taste", key);
    const doc = id
      ? await ctx.db.get("taste", id)
      : await ctx.db
          .query("taste")
          .withIndex("by_slug", (q) => q.eq("slug", key))
          .unique();
    return doc?.published === false ? null : doc;
  },
});

export const createEntry = mutation({
  args: { entry: tasteDraft },
  handler: async (ctx, { entry }) => {
    await admin(ctx);
    const data = await prepare(ctx, entry);
    const all = await ctx.db.query("taste").collect();
    return await ctx.db.insert("taste", {
      ...data,
      slug: await uniqueSlug(ctx, data.title),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      revision: 1,
      order: all.reduce((min, item) => Math.min(min, item.order ?? 0), 0) - 1,
    });
  },
});
export const saveEntry = mutation({
  args: { id: v.id("taste"), expectedRevision: v.number(), entry: tasteDraft },
  handler: async (ctx, { id, expectedRevision, entry }) => {
    await admin(ctx);
    const existing = await ctx.db.get("taste", id);
    if (!existing) fail("This entry no longer exists.", "NOT_FOUND");
    checkRevision(existing.revision, expectedRevision);
    const data = await prepare(ctx, entry);
    await ctx.db.patch("taste", id, {
      ...data,
      slug: existing.slug ?? (await uniqueSlug(ctx, data.title)),
      revision: (existing.revision ?? 0) + 1,
      updatedAt: Date.now(),
    });
  },
});
export const deleteEntry = mutation({
  args: { id: v.id("taste"), expectedRevision: v.number() },
  handler: async (ctx, { id, expectedRevision }) => {
    await admin(ctx);
    const doc = await ctx.db.get("taste", id);
    if (!doc) fail("This entry no longer exists.", "NOT_FOUND");
    checkRevision(doc.revision, expectedRevision);
    await ctx.db.delete("taste", id);
  },
});
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await admin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// Keep the old API usable during rollout; partial writes never erase new fields.
const legacyFields = {
  title: v.optional(v.string()),
  url: v.optional(v.string()),
  content: v.optional(v.string()),
  designNotes: v.optional(v.string()),
  screenshotUrls: v.optional(v.array(v.string())),
  tags: v.optional(v.array(v.string())),
};
export const create = mutation({
  args: { ...legacyFields, title: v.string(), url: v.string() },
  handler: async (ctx, args) => {
    await admin(ctx);
    const draft = {
      ...emptyTasteDraft(),
      ...args,
      published: true,
      media: (args.screenshotUrls ?? []).map((url, index) => ({
        id: `image-${index}`,
        kind: "image" as const,
        url,
      })),
      content: args.content ?? "",
      designNotes: args.designNotes ?? "",
      tags: args.tags ?? [],
    };
    const data = await prepare(ctx, draft);
    const all = await ctx.db.query("taste").collect();
    return await ctx.db.insert("taste", {
      ...data,
      slug: await uniqueSlug(ctx, args.title),
      createdAt: Date.now(),
      revision: 1,
      order: all.reduce((min, item) => Math.min(min, item.order ?? 0), 0) - 1,
    });
  },
});
export const update = mutation({
  args: { id: v.id("taste"), ...legacyFields },
  handler: async (ctx, { id, ...patch }) => {
    await admin(ctx);
    const old = await ctx.db.get("taste", id);
    if (!old) fail("This entry no longer exists.", "NOT_FOUND");
    if (
      old.media !== undefined &&
      patch.screenshotUrls !== undefined &&
      JSON.stringify(patch.screenshotUrls) !==
        JSON.stringify(old.screenshotUrls ?? [])
    )
      fail(
        "Use the current taste editor to change this entry’s media.",
        "CONFLICT",
      );
    const merged = { ...old, ...patch };
    const error = validateTaste(toTasteDraft(merged));
    if (error) fail(error);
    await ctx.db.patch("taste", id, {
      ...patch,
      revision: (old.revision ?? 0) + 1,
      updatedAt: Date.now(),
    });
  },
});
export const remove = mutation({
  args: { id: v.id("taste") },
  handler: async (ctx, { id }) => {
    await admin(ctx);
    await ctx.db.delete("taste", id);
  },
});
export const reorder = mutation({
  args: { ids: v.array(v.id("taste")) },
  handler: async (ctx, { ids }) => {
    await admin(ctx);
    const items = await ctx.db.query("taste").collect();
    if (
      new Set(ids).size !== ids.length ||
      ids.length !== items.length ||
      items.some((item) => !ids.includes(item._id))
    )
      fail("The collection changed. Reload before reordering.", "CONFLICT");
    await Promise.all(
      ids.map((id, order) => ctx.db.patch("taste", id, { order })),
    );
  },
});
