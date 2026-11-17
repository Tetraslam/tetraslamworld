import { convexTest } from "convex-test";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api, internal } from "../convex/_generated/api";
import schema from "../convex/schema";

const modules = Object.fromEntries(
  [
    "work",
    "friends",
    "media",
    "travel",
    "links",
    "gallery",
    "files",
    "wetMode",
    "emailList",
    "homepage",
    "lib/admin",
    "seeds/refresh2026",
  ].map((name) => [`../convex/${name}.ts`, () => import(`../convex/${name}`)]),
);
modules["../convex/_generated/server.js"] = () =>
  import("../convex/_generated/server.js");
modules["../convex/_generated/api.js"] = () =>
  import("../convex/_generated/api.js");
beforeEach(() => vi.stubEnv("ADMIN_USER_IDS", "admin-test"));
afterEach(() => vi.unstubAllEnvs());

const work = { type: "project" as const, title: "a project" };

test("content writes are owner-only", async () => {
  const t = convexTest(schema, modules);
  const writes = [
    () => t.mutation(api.work.create, work),
    () => t.mutation(api.friends.create, { name: "someone" }),
    () => t.mutation(api.media.create, { type: "concert", title: "a show" }),
    () =>
      t.mutation(api.travel.create, {
        location: "somewhere",
        coordinates: { lat: 0, lng: 0 },
      }),
    () => t.mutation(api.links.create, { title: "a link", url: "https://a.b" }),
    () => t.mutation(api.gallery.create, { imageUrl: "https://a.b/c.png" }),
    () => t.mutation(api.files.generateUploadUrl, {}),
    () => t.mutation(api.wetMode.set, { content: "x" }),
    () => t.mutation(api.emailList.clear, {}),
  ];
  for (const write of writes)
    await expect(write()).rejects.toThrow(/UNAUTHORIZED/);
  await expect(
    t.withIdentity({ subject: "reader" }).mutation(api.work.create, work),
  ).rejects.toThrow(/UNAUTHORIZED/);
  await expect(t.query(api.emailList.list, {})).rejects.toThrow(/UNAUTHORIZED/);

  await t
    .withIdentity({ subject: "admin-test" })
    .mutation(api.work.create, work);
  expect(await t.query(api.work.list, {})).toHaveLength(1);
});

test("visitors can subscribe and check only their own address", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.emailList.add, { emails: ["Me@Example.com"] });
  expect(
    await t.query(api.emailList.isSubscribed, { email: "me@example.com" }),
  ).toBe(true);
  expect(
    await t.query(api.emailList.isSubscribed, { email: "you@example.com" }),
  ).toBe(false);
});

test("the now note keeps its date until its text changes", async () => {
  const t = convexTest(schema, modules);
  const admin = t.withIdentity({ subject: "admin-test" });
  const first = await admin.mutation(api.homepage.save, {
    heading: "hi",
    body: "bio",
    now: "in sf",
    expectedRevision: 0,
  });
  expect(first.nowUpdatedAt).toBeGreaterThan(0);
  // A client that predates the note leaves it alone.
  const second = await admin.mutation(api.homepage.save, {
    heading: "hi!",
    body: "bio",
    expectedRevision: 1,
  });
  expect(second.now).toBe("in sf");
  expect(second.nowUpdatedAt).toBe(first.nowUpdatedAt);
  await expect(
    admin.mutation(api.homepage.save, {
      heading: "hi",
      body: "bio",
      now: "x".repeat(601),
      expectedRevision: 2,
    }),
  ).rejects.toThrow(/INVALID_CONTENT/);
});

test("the content refresh applies once", async () => {
  const t = convexTest(schema, modules);
  await t.run(async (ctx) => {
    await ctx.db.insert("work", {
      type: "other",
      title: "sapientia research",
    });
    await ctx.db.insert("travel", {
      location: "paris",
      coordinates: { lat: 48.87, lng: 2.29 },
      content: "lived here.",
      order: 0,
    });
    await ctx.db.insert("friends", { name: "someone", order: 0 });
  });
  const first = await t.mutation(internal.seeds.refresh2026.apply, {
    images: {},
  });
  expect(first).toContain("work + mts @ aire");
  expect(first).toContain("work - sapientia research");
  expect(first).toContain("travel ~ paris");
  expect(
    await t.mutation(internal.seeds.refresh2026.apply, { images: {} }),
  ).toEqual([]);
  const projects = await t.query(api.work.list, { type: "project" });
  expect(
    projects.filter((item) => item.featured).map((item) => item.title),
  ).toEqual(expect.arrayContaining(["kiseki", "lispium", "computah", "omavn"]));
});
