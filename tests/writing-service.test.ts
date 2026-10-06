import { randomUUID } from "node:crypto";
import { expect, test } from "vitest";
import {
  defaultPost,
  emptyWritingIndex,
  parsePost,
  serializePost,
} from "../shared/writing";
import {
  type GitSnapshot,
  WritingError,
  type WritingGit,
} from "../src/lib/writing/git";
import { WritingService } from "../src/lib/writing/service";

class MemoryGit implements WritingGit {
  head = "0".repeat(40);
  sequence = 0;
  loseAcknowledgement = false;
  beforeCommit: (() => Promise<void>) | undefined;
  versions = new Map<string, Record<string, string>>([
    [
      this.head,
      {
        "writing/index.json": JSON.stringify({
          ...emptyWritingIndex(),
          migration: { verified: true },
        }),
      },
    ],
  ]);
  async snapshot() {
    return { head: this.head, tree: this.head };
  }
  async read(path: string, at: string) {
    return this.versions.get(at)?.[path] ?? null;
  }
  async commit(base: GitSnapshot, files: Record<string, string | null>) {
    if (this.beforeCommit) {
      const callback = this.beforeCommit;
      this.beforeCommit = undefined;
      await callback();
    }
    if (base.head !== this.head)
      throw new WritingError("GIT_CONFLICT", "competing commit", 409);
    const tree = { ...this.versions.get(this.head) };
    for (const [path, value] of Object.entries(files))
      if (value === null) delete tree[path];
      else tree[path] = value;
    this.head = String(++this.sequence).padStart(40, "0");
    this.versions.set(this.head, tree);
    if (this.loseAcknowledgement) {
      this.loseAcknowledgement = false;
      throw new WritingError("GITHUB_UNAVAILABLE", "response lost", 503);
    }
    return this.head;
  }
  async history() {
    return [];
  }
}
function setup() {
  const git = new MemoryGit();
  let now = new Date("2026-10-01T12:00:00Z");
  const service = new WritingService(git, () => now);
  return {
    git,
    service,
    advance: () => {
      now = new Date("2026-10-03T12:00:00Z");
    },
  };
}
const post = (id = randomUUID()) => ({
  ...defaultPost(id),
  title: "A draft",
  body: "Some writing.",
});
const op = (id: string, expectedRevision: string | null) => ({
  id,
  operationId: randomUUID(),
  expectedRevision,
});

test("publication freezes a revision; further edits stay private and unpublishing keeps the draft", async () => {
  const { service, git, advance } = setup(),
    p = post();
  const saved = await service.save({ ...op(p.id, null), post: p });
  await service.publish({
    ...op(p.id, saved.revision),
    expectedPublication: null,
  });
  const published = (await service.load()).index.entries[p.id].published!;
  expect(parsePost((await git.read(published.path, git.head))!).body).toBe(
    p.body,
  );
  expect(published.meta.date).toBe("2026-10-01T12:00:00.000Z");
  advance();
  const edited = await service.save({
    ...op(p.id, saved.revision),
    post: { ...p, body: "Private revision." },
  });
  expect((await service.load()).index.entries[p.id].published).toEqual(
    published,
  );
  await service.unpublish({
    ...op(p.id, edited.revision),
    expectedPublication: published.revision,
  });
  expect((await service.readDraft(p.id)).post.body).toBe("Private revision.");
  expect((await service.load()).index.entries[p.id].published).toBeNull();
});
test("two editors cannot overwrite one another", async () => {
  const { service } = setup(),
    p = post();
  const saved = await service.save({ ...op(p.id, null), post: p });
  const results = await Promise.allSettled(
    ["first", "second"].map((body) =>
      service.save({ ...op(p.id, saved.revision), post: { ...p, body } }),
    ),
  );
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
});
test("unrelated posts survive a Git ref race", async () => {
  const { service } = setup();
  const a = post(),
    b = post();
  await Promise.all(
    [a, b].map((p) => service.save({ ...op(p.id, null), post: p })),
  );
  expect(Object.keys((await service.load()).index.entries)).toHaveLength(2);
});
test("retry after a lost acknowledgement returns the committed revision without another write", async () => {
  const { service, git } = setup(),
    p = post(),
    input = { ...op(p.id, null), post: p };
  git.loseAcknowledgement = true;
  await expect(service.save(input)).rejects.toMatchObject({
    code: "GITHUB_UNAVAILABLE",
  });
  const result = await service.save(input);
  expect(result.replayed).toBe(true);
  expect(git.sequence).toBe(1);
  await expect(
    service.save({ ...input, post: { ...p, body: "changed payload" } }),
  ).rejects.toMatchObject({ code: "INVALID_RETRY" });
});
test("scheduled publication uses the frozen version while newer drafting continues", async () => {
  const { service, git, advance } = setup(),
    p = post();
  const saved = await service.save({ ...op(p.id, null), post: p });
  await service.publish({
    ...op(p.id, saved.revision),
    expectedPublication: null,
    at: "2026-10-02T12:00:00Z",
  });
  await service.save({
    ...op(p.id, saved.revision),
    post: { ...p, body: "new private thought" },
  });
  advance();
  expect(await service.publishDue()).toEqual({ published: 1 });
  expect(await service.publishDue()).toEqual({ published: 0 });
  const entry = (await service.load()).index.entries[p.id];
  expect(
    parsePost((await git.read(entry.published!.path, git.head))!).body,
  ).toBe(p.body);
  expect((await service.readDraft(p.id)).post.body).toBe("new private thought");
});
test("a cancellation winning the ref race prevents the scheduled publication", async () => {
  const { service, git, advance } = setup(),
    p = post();
  const saved = await service.save({ ...op(p.id, null), post: p });
  const schedule = op(p.id, saved.revision);
  await service.publish({
    ...schedule,
    expectedPublication: null,
    at: "2026-10-02T12:00:00Z",
  });
  advance();
  git.beforeCommit = () =>
    service
      .cancelSchedule({
        ...op(p.id, saved.revision),
        scheduleId: schedule.operationId,
      })
      .then(() => {});
  expect(await service.publishDue()).toEqual({ published: 0 });
  expect((await service.load()).index.entries[p.id].published).toBeNull();
});
test("an unbacked asset cannot enter a publication", async () => {
  const { service } = setup(),
    p = { ...post(), body: `![image](writing-asset:${"a".repeat(64)})` };
  const saved = await service.save({ ...op(p.id, null), post: p });
  await expect(
    service.publish({ ...op(p.id, saved.revision), expectedPublication: null }),
  ).rejects.toMatchObject({ code: "MEDIA_NOT_READY" });
});
test("Markdown and opaque future blocks survive source serialization", () => {
  const p = {
    ...post(),
    body: 'A paragraph.\n\n```writing\n{"type":"future-widget","settings":{"a":[1,2]}}\n```\n',
  };
  expect(parsePost(serializePost(p))).toEqual(p);
});
