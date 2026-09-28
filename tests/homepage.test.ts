import { convexTest } from "convex-test";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";
import { DEFAULT_HOME, HOME_LIMITS } from "../shared/home-content";

const modules = {
  "../convex/homepage.ts": () => import("../convex/homepage"),
  "../convex/_generated/server.js": () =>
    import("../convex/_generated/server.js"),
};
beforeEach(() => vi.stubEnv("ADMIN_USER_IDS", "admin-test"));
afterEach(() => vi.unstubAllEnvs());
const draft = {
  heading: "hello",
  body: "a bio with [a link](/work)",
  expectedRevision: 0,
};

test("public defaults do not seed or modify the database", async () => {
  const t = convexTest(schema, modules);
  expect(await t.query(api.homepage.get, {})).toEqual(DEFAULT_HOME);
  expect(
    await t.run((ctx) => ctx.db.query("siteContent").collect()),
  ).toHaveLength(0);
});

test("anonymous and non-admin callers cannot save", async () => {
  const t = convexTest(schema, modules);
  await expect(t.mutation(api.homepage.save, draft)).rejects.toThrow(
    /UNAUTHORIZED/,
  );
  await expect(
    t
      .withIdentity({ subject: "reader-test" })
      .mutation(api.homepage.save, draft),
  ).rejects.toThrow(/UNAUTHORIZED/);
  expect(await t.query(api.homepage.get, {})).toEqual(DEFAULT_HOME);
});

test("missing backend allowlist denies even a signed-in user", async () => {
  vi.stubEnv("ADMIN_USER_IDS", "");
  const t = convexTest(schema, modules);
  await expect(
    t
      .withIdentity({ subject: "admin-test" })
      .mutation(api.homepage.save, draft),
  ).rejects.toThrow(/UNAUTHORIZED/);
});

test("authorized saves update one singleton and reject stale drafts", async () => {
  const t = convexTest(schema, modules);
  const admin = t.withIdentity({ subject: "admin-test" });
  const first = await admin.mutation(api.homepage.save, draft);
  expect(first).toMatchObject({
    heading: draft.heading,
    body: draft.body,
    revision: 1,
  });
  await expect(
    admin.mutation(api.homepage.save, { ...draft, body: "stale draft" }),
  ).rejects.toThrow(/CONFLICT/);
  expect((await t.query(api.homepage.get, {})).body).toBe(draft.body);
  await admin.mutation(api.homepage.save, {
    ...draft,
    body: "new copy",
    expectedRevision: 1,
  });
  expect((await t.query(api.homepage.get, {})).revision).toBe(2);
  expect(
    await t.run((ctx) => ctx.db.query("siteContent").collect()),
  ).toHaveLength(1);
});

test("invalid content cannot partially change a saved bio", async () => {
  const t = convexTest(schema, modules);
  const admin = t.withIdentity({ subject: "admin-test" });
  await admin.mutation(api.homepage.save, draft);
  for (const invalid of [
    { heading: " ", body: "text" },
    { heading: "hello", body: " " },
    { heading: "x".repeat(HOME_LIMITS.heading + 1), body: "text" },
    { heading: "hello", body: "x".repeat(HOME_LIMITS.body + 1) },
  ])
    await expect(
      admin.mutation(api.homepage.save, { ...invalid, expectedRevision: 1 }),
    ).rejects.toThrow(/INVALID_CONTENT/);
  expect((await t.query(api.homepage.get, {})).body).toBe(draft.body);
  expect((await t.query(api.homepage.get, {})).revision).toBe(1);
});

test("maximum-sized copy survives without truncation", async () => {
  const t = convexTest(schema, modules);
  const value = {
    heading: "h".repeat(HOME_LIMITS.heading),
    body: "b".repeat(HOME_LIMITS.body),
    expectedRevision: 0,
  };
  await t
    .withIdentity({ subject: "admin-test" })
    .mutation(api.homepage.save, value);
  const saved = await t.query(api.homepage.get, {});
  expect(saved.heading).toBe(value.heading);
  expect(saved.body).toBe(value.body);
});

test("simultaneous first saves cannot create two home records", async () => {
  const t = convexTest(schema, modules);
  const admin = t.withIdentity({ subject: "admin-test" });
  const results = await Promise.allSettled([
    admin.mutation(api.homepage.save, { ...draft, heading: "first editor" }),
    admin.mutation(api.homepage.save, { ...draft, heading: "second editor" }),
  ]);
  expect(
    results.filter((result) => result.status === "fulfilled"),
  ).toHaveLength(1);
  expect(
    await t.run((ctx) => ctx.db.query("siteContent").collect()),
  ).toHaveLength(1);
  expect((await t.query(api.homepage.get, {})).revision).toBe(1);
});
