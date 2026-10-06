import { expect, test } from "vitest";
import { GithubWritingGit } from "../src/lib/writing/git";

test("rejects an unreadable index before creating a Git tree or changing the ref", async () => {
  const git = new GithubWritingGit();
  await expect(
    git.commit(
      { head: "0".repeat(40), tree: "0".repeat(40) },
      { "writing/index.json": "x".repeat(20_000_001) },
      "Oversized index fixture",
    ),
  ).rejects.toMatchObject({ code: "LIMIT" });
});
