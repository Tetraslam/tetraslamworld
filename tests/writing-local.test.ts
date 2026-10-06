// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { afterEach, expect, test, vi } from "vitest";
import { defaultPost } from "../shared/writing";
import {
  clearRecoveredCopy,
  getRecovery,
  getRecoveryCopies,
  putRecovery,
} from "../src/lib/writing/local";

afterEach(() => vi.unstubAllGlobals());
test("two tabs keep independent unsynced recovery copies", async () => {
  const id = crypto.randomUUID(),
    post = defaultPost(id);
  await putRecovery(
    "owner",
    {
      post: { ...post, body: "from tab A" },
      baseRevision: "base",
      savedAt: 1,
      dirty: true,
    },
    "tab-a",
  );
  await putRecovery(
    "owner",
    {
      post: { ...post, body: "from tab B" },
      baseRevision: "base",
      savedAt: 2,
      dirty: true,
    },
    "tab-b",
  );
  expect(
    (await getRecoveryCopies("owner", id)).map((copy) => copy.post.body),
  ).toEqual(["from tab B", "from tab A"]);
  vi.stubGlobal("navigator", {
    locks: {
      query: async () => ({ held: [{ name: `writing:owner/${id}/tab-b` }] }),
    },
  });
  expect((await getRecovery("owner", id))?.post.body).toBe("from tab A");
});
test("clearing a recovered checkpoint cannot delete newer work from that tab", async () => {
  const id = crypto.randomUUID(),
    post = defaultPost(id);
  await putRecovery(
    "owner",
    { post, baseRevision: null, savedAt: 1, dirty: true },
    "tab",
  );
  const old = (await getRecoveryCopies("owner", id))[0];
  await putRecovery(
    "owner",
    {
      post: { ...post, body: "newer work" },
      baseRevision: null,
      savedAt: 2,
      dirty: true,
    },
    "tab",
  );
  await clearRecoveredCopy("owner", old);
  expect((await getRecoveryCopies("owner", id))[0].post.body).toBe(
    "newer work",
  );
});
