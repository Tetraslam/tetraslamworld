import { strict as assert } from "node:assert";
import { randomUUID } from "node:crypto";
import { defaultPost, parsePost } from "../../shared/writing";
import {
  GithubWritingGit,
  github,
  WritingError,
  type WritingGit,
} from "../../src/lib/writing/git";
import { WritingService } from "../../src/lib/writing/service";

async function main() {
  const repository = process.env.WRITING_REPOSITORY!;
  const repos = await github<{
    repositories: Array<{ full_name: string; private: boolean }>;
  }>("/installation/repositories");
  assert.equal(repos.repositories.length, 1);
  assert.equal(repos.repositories[0].full_name, repository);
  assert.equal(repos.repositories[0].private, true);
  const base = await github<{ object: { sha: string } }>(
    `/repos/${repository}/git/ref/heads/main`,
  );
  const branch = `verification/studio-${randomUUID().slice(0, 8)}`;
  await github(`/repos/${repository}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: base.object.sha }),
  });
  process.env.WRITING_BRANCH = branch;
  const real = new GithubWritingGit();
  let lose = false,
    now = new Date();
  const git: WritingGit = {
    snapshot: () => real.snapshot(),
    read: (path, at) => real.read(path, at),
    history: (path, limit) => real.history(path, limit),
    commit: async (...args) => {
      const sha = await real.commit(...args);
      if (lose) {
        lose = false;
        throw new WritingError(
          "GITHUB_UNAVAILABLE",
          "simulated lost acknowledgement",
          503,
        );
      }
      return sha;
    },
  };
  const service = new WritingService(git, () => now),
    id = randomUUID(),
    post = {
      ...defaultPost(id),
      title: "Verification fixture",
      body: "This is an isolated verification draft.",
    };
  const op = (revision: string | null) => ({
    id,
    operationId: randomUUID(),
    expectedRevision: revision,
  });
  const fixture=await service.load();fixture.index.migration.verified=true;await git.commit(fixture.snapshot,{"writing/index.json":JSON.stringify(fixture.index,null,2)},"Enable isolated publication verification");
  let saved = await service.save({ ...op(null), post });
  const results = await Promise.allSettled(
    ["one", "two"].map((body) =>
      service.save({ ...op(saved.revision), post: { ...post, body } }),
    ),
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(results.filter((r) => r.status === "rejected").length, 1);
  let current = await service.readDraft(id);
  const uncertain = {
    ...op(current.revision),
    post: { ...post, body: "Recover after a lost acknowledgement." },
  };
  lose = true;
  await assert.rejects(service.save(uncertain));
  saved = await service.save(uncertain);
  assert.equal(saved.replayed, true);
  await service.publish({ ...op(saved.revision), expectedPublication: null });
  const release = (await service.load()).index.entries[id].published!;
  await service.save({
    ...op(saved.revision),
    post: { ...post, body: "Private edits after publication." },
  });
  assert.equal(
    parsePost((await git.read(release.path, (await git.snapshot()).head))!)
      .body,
    uncertain.post.body,
  );
  current = await service.readDraft(id);
  const schedule = op(current.revision);
  await service.publish({
    ...schedule,
    expectedPublication: release.revision,
    at: new Date(now.getTime() + 60_000).toISOString(),
  });
  await service.cancelSchedule({
    ...op(current.revision),
    scheduleId: schedule.operationId,
  });
  now = new Date(now.getTime() + 120_000);
  const loaded = await service.load();
  loaded.index.migration.verified = true;
  await git.commit(
    loaded.snapshot,
    { "writing/index.json": JSON.stringify(loaded.index, null, 2) },
    "Enable isolated schedule verification",
  );
  assert.equal((await service.publishDue()).published, 0);
  console.log(
    JSON.stringify({
      verified: true,
      branch,
      checks: [
        "repository-scoped app",
        "real Git ref conflict",
        "lost acknowledgement retry",
        "frozen publication",
        "cancelled schedule",
      ],
      productionMutated: false,
    }),
  );
}
void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Verification failed");
  process.exitCode = 1;
});
