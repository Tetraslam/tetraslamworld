import { convexTest } from "convex-test";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";
import {
  embedSource,
  emptyTasteDraft,
  filterTaste,
  tasteCategories,
  tasteMedia,
  toTasteDraft,
  validateTaste,
} from "../shared/taste";

const modules = {
  "../convex/taste.ts": () => import("../convex/taste"),
  "../convex/_generated/server.js": () =>
    import("../convex/_generated/server.js"),
};
beforeEach(() => vi.stubEnv("ADMIN_USER_IDS", "admin-test"));
afterEach(() => vi.unstubAllEnvs());
const example = () => ({
  ...emptyTasteDraft(),
  title: "A beautiful mechanism",
  content: "The linkage is the part I like.",
  categories: ["mechanisms"],
  qualities: ["restraint"],
  media: [
    {
      id: "photo",
      kind: "image" as const,
      url: "https://example.com/photo.jpg",
      width: 1200,
      height: 1600,
      alt: "The linkage",
    },
  ],
});

test("legacy records normalize without rewriting their data", async () => {
  const t = convexTest(schema, modules);
  const original = {
    title: "Old reference",
    url: "https://example.com",
    designNotes: "Original observations",
    screenshotUrls: ["https://example.com/one.png"],
    tags: ["shaders"],
    createdAt: 100,
  };
  const id = await t.run((ctx) => ctx.db.insert("taste", original));
  const before = await t.query(api.taste.get, { id });
  expect(before).not.toBeNull();
  if (!before) throw new Error();
  expect(tasteMedia(before)[0].url).toBe(original.screenshotUrls[0]);
  expect(tasteCategories(before)).toEqual(["websites", "shaders"]);
  expect(toTasteDraft(before).published).toBe(true);
  expect(await t.query(api.taste.getByKey, { key: id })).toEqual(before);
  expect(await t.query(api.taste.get, { id })).toEqual(before);
});

test("all taste writes and private draft reads require the administrator", async () => {
  const t = convexTest(schema, modules);
  const admin = t.withIdentity({ subject: "admin-test" });
  const id = await admin.mutation(api.taste.createEntry, { entry: example() });
  for (const caller of [t, t.withIdentity({ subject: "reader-test" })]) {
    await expect(
      caller.mutation(api.taste.createEntry, { entry: example() }),
    ).rejects.toThrow(/UNAUTHORIZED/);
    await expect(
      caller.mutation(api.taste.saveEntry, {
        id,
        expectedRevision: 1,
        entry: example(),
      }),
    ).rejects.toThrow(/UNAUTHORIZED/);
    await expect(
      caller.mutation(api.taste.deleteEntry, { id, expectedRevision: 1 }),
    ).rejects.toThrow(/UNAUTHORIZED/);
    await expect(
      caller.mutation(api.taste.reorder, { ids: [id] }),
    ).rejects.toThrow(/UNAUTHORIZED/);
    await expect(
      caller.mutation(api.taste.generateUploadUrl, {}),
    ).rejects.toThrow(/UNAUTHORIZED/);
    await expect(caller.query(api.taste.adminList, {})).rejects.toThrow(
      /UNAUTHORIZED/,
    );
    await expect(
      caller.mutation(api.taste.update, { id, title: "changed" }),
    ).rejects.toThrow(/UNAUTHORIZED/);
  }
});

test("drafts remain private until publication and slugs stay stable", async () => {
  const t = convexTest(schema, modules),
    admin = t.withIdentity({ subject: "admin-test" });
  const draft = example(),
    id = await admin.mutation(api.taste.createEntry, { entry: draft });
  expect(await t.query(api.taste.list, {})).toEqual([]);
  expect(
    await t.query(api.taste.getByKey, { key: "a-beautiful-mechanism" }),
  ).toBeNull();
  expect(await t.query(api.taste.get, { id })).toBeNull();
  await admin.mutation(api.taste.saveEntry, {
    id,
    expectedRevision: 1,
    entry: { ...draft, title: "A new title", published: true },
  });
  expect(
    (await t.query(api.taste.getByKey, { key: "a-beautiful-mechanism" }))
      ?.title,
  ).toBe("A new title");
  expect((await t.query(api.taste.getByKey, { key: id }))?.revision).toBe(2);
  const other = await admin.mutation(api.taste.createEntry, {
    entry: { ...draft, published: true },
  });
  expect((await t.query(api.taste.get, { id: other }))?.slug).toBe(
    "a-beautiful-mechanism-2",
  );
});

test("a stale editor cannot overwrite or delete a newer entry", async () => {
  const t = convexTest(schema, modules),
    admin = t.withIdentity({ subject: "admin-test" });
  const draft = { ...example(), published: true },
    id = await admin.mutation(api.taste.createEntry, { entry: draft });
  await admin.mutation(api.taste.saveEntry, {
    id,
    expectedRevision: 1,
    entry: { ...draft, observation: "new observation" },
  });
  await expect(
    admin.mutation(api.taste.saveEntry, {
      id,
      expectedRevision: 1,
      entry: draft,
    }),
  ).rejects.toThrow(/CONFLICT/);
  await expect(
    admin.mutation(api.taste.deleteEntry, { id, expectedRevision: 1 }),
  ).rejects.toThrow(/CONFLICT/);
  expect((await t.query(api.taste.get, { id }))?.observation).toBe(
    "new observation",
  );
});

test("clearing structured media never resurrects legacy screenshots", async () => {
  const t = convexTest(schema, modules),
    admin = t.withIdentity({ subject: "admin-test" });
  const id = await t.run((ctx) =>
    ctx.db.insert("taste", {
      title: "old",
      url: "https://example.com",
      createdAt: 1,
      screenshotUrls: ["https://example.com/old.jpg"],
    }),
  );
  const old = await t.query(api.taste.get, { id });
  if (!old) throw new Error();
  await admin.mutation(api.taste.saveEntry, {
    id,
    expectedRevision: 0,
    entry: { ...toTasteDraft(old), media: [], coverId: "", content: "" },
  });
  const saved = await t.query(api.taste.get, { id });
  if (!saved) throw new Error();
  expect(tasteMedia(saved)).toEqual([]);
  expect(saved.screenshotUrls).toEqual([]);
  expect(saved.content).toBe("");
});

test("legacy partial writes preserve richer fields and advance the revision", async () => {
  const t = convexTest(schema, modules),
    admin = t.withIdentity({ subject: "admin-test" });
  const id = await admin.mutation(api.taste.createEntry, {
    entry: { ...example(), published: true },
  });
  await admin.mutation(api.taste.update, { id, content: "legacy edit" });
  const item = await t.query(api.taste.get, { id });
  expect(item?.media).toHaveLength(1);
  expect(item?.qualities).toEqual(["restraint"]);
  expect(item?.revision).toBe(2);
  await expect(
    admin.mutation(api.taste.update, { id, screenshotUrls: [] }),
  ).rejects.toThrow(/current taste editor/);
});

test("incomplete or duplicate reorder requests leave all ordering intact", async () => {
  const t = convexTest(schema, modules),
    admin = t.withIdentity({ subject: "admin-test" });
  const a = await admin.mutation(api.taste.createEntry, { entry: example() }),
    b = await admin.mutation(api.taste.createEntry, { entry: example() });
  const before = await admin.query(api.taste.adminList, {});
  await expect(admin.mutation(api.taste.reorder, { ids: [a] })).rejects.toThrow(
    /CONFLICT/,
  );
  await expect(
    admin.mutation(api.taste.reorder, { ids: [a, a] }),
  ).rejects.toThrow(/CONFLICT/);
  expect(await admin.query(api.taste.adminList, {})).toEqual(before);
  await admin.mutation(api.taste.reorder, { ids: [a, b] });
  const after = await admin.query(api.taste.adminList, {});
  expect(after.find((item) => item._id === a)?.order).toBe(0);
  expect(after.find((item) => item._id === b)?.order).toBe(1);
});

test("limits, unsafe URLs, duplicate IDs and invalid time ranges are rejected", () => {
  const base = example();
  expect(validateTaste(base)).toBeNull();
  expect(validateTaste({ ...base, url: "javascript:alert(1)" })).not.toBeNull();
  expect(validateTaste({ ...base, coverId: "missing" })).not.toBeNull();
  expect(
    validateTaste({ ...base, media: [base.media[0], base.media[0]] }),
  ).not.toBeNull();
  expect(
    validateTaste({
      ...base,
      media: [
        {
          id: "v",
          kind: "video",
          url: "https://example.com/v.mp4",
          startSeconds: 8,
          endSeconds: 3,
        },
      ],
    }),
  ).not.toBeNull();
  expect(
    validateTaste({
      ...base,
      media: [{ id: "x", kind: "embed", url: "http://example.com" }],
    }),
  ).not.toBeNull();
  expect(
    validateTaste({
      ...base,
      media: [{ id: "t", kind: "text", text: "x".repeat(6001) }],
    }),
  ).not.toBeNull();
});

test("qualities connect different categories and search includes annotations", () => {
  const records = [
    { ...example(), _id: "one", createdAt: 1, published: true },
    {
      ...example(),
      _id: "two",
      title: "Quiet library",
      categories: ["architecture"],
      createdAt: 2,
      published: true,
    },
  ];
  expect(
    filterTaste(records, { q: "", category: "", quality: "restraint" }),
  ).toHaveLength(2);
  expect(
    filterTaste(records, { q: "linkage", category: "mechanisms", quality: "" }),
  ).toHaveLength(1);
});

test("known embeds are adapted and arbitrary examples remain opaque", () => {
  expect(embedSource("https://youtu.be/dQw4w9WgXcQ").url).toContain(
    "youtube-nocookie.com/embed/",
  );
  expect(embedSource("https://codepen.io/person/pen/abc123").trusted).toBe(
    true,
  );
  expect(embedSource("https://example.com/experiment").trusted).toBe(false);
  expect(embedSource("https://codepen.io/other/path").trusted).toBe(false);
});

test("uploaded media must exist and match its declared kind", async () => {
  const t = convexTest(schema, modules),
    admin = t.withIdentity({ subject: "admin-test" });
  const image = await t.run((ctx) =>
    ctx.storage.store(new Blob(["image bytes"], { type: "image/png" })),
  );
  const audio = await t.run((ctx) =>
    ctx.storage.store(new Blob(["audio bytes"], { type: "audio/wav" })),
  );
  // convex-test's storeBlob omits MIME metadata. Seed the fields that a real
  // generateUploadUrl POST with Content-Type creates, inside the isolated DB.
  await t.run(async (ctx) => {
    const fixtureDb = ctx.db as unknown as {
      patch: (id: string, fields: { contentType: string }) => Promise<void>;
    };
    await fixtureDb.patch(image, { contentType: "image/png" });
    await fixtureDb.patch(audio, { contentType: "audio/wav" });
  });
  const draft = example();
  await expect(
    admin.mutation(api.taste.createEntry, {
      entry: {
        ...draft,
        media: [
          {
            id: "bad",
            kind: "image",
            url: "https://example.com/x",
            storageId: audio,
          },
        ],
      },
    }),
  ).rejects.toThrow(/wrong media type/);
  const id = await admin.mutation(api.taste.createEntry, {
    entry: {
      ...draft,
      published: true,
      media: [
        {
          id: "ok",
          kind: "image",
          url: "https://example.com/ignored",
          storageId: image,
        },
      ],
    },
  });
  const saved = await t.query(api.taste.get, { id });
  expect(saved?.media?.[0].storageId).toBe(image);
  expect(saved?.media?.[0].url).not.toBe("https://example.com/ignored");
});
