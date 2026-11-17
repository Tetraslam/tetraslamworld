import "server-only";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { gunzipSync } from "node:zlib";
import { unstable_cache } from "next/cache";
import { untar } from "../../../shared/tar";
import {
  isTetrastackFile,
  parseTetrastack,
  TETRASTACK_REPO,
  type Tetrastack,
  type TetrastackFiles,
} from "../../../shared/tetrastack";
import snapshot from "./snapshot.json";

/**
 * Loads tetrastack's markdown. Production reads the latest commit on GitHub
 * (one archive request, so every file comes from the same commit) and caches
 * it for an hour under the "tetrastack" tag. A push webhook can expire it
 * early (see /api/taste/revalidate). If GitHub can't be reached the last good
 * copy keeps serving, and the vendored snapshot covers a cold start.
 *
 * TETRASTACK_DIR=~/Programming/tetrastack reads a local clone instead, for
 * previewing edits before pushing them.
 */

export const TETRASTACK_TAG = "tetrastack";
const REF = process.env.TETRASTACK_REF || "main";
const ARCHIVE = `https://codeload.github.com/${process.env.TETRASTACK_REPO || TETRASTACK_REPO}/tar.gz/refs/heads/${REF}`;

export async function fetchFromGitHub(): Promise<TetrastackFiles> {
  const response = await fetch(ARCHIVE, {
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`tetrastack archive: ${response.status}`);
  const archive = untar(
    gunzipSync(new Uint8Array(await response.arrayBuffer())),
  );
  const files: Record<string, string> = {};
  const decoder = new TextDecoder();
  for (const [path, bytes] of Object.entries(archive.files))
    if (isTetrastackFile(path)) files[path] = decoder.decode(bytes);
  if (!files["taste.md"]) throw new Error("tetrastack archive has no taste.md");
  return {
    sha: archive.commit ?? REF,
    updatedAt: archive.mtime,
    origin: "github",
    files,
  };
}

async function readLocal(dir: string): Promise<TetrastackFiles> {
  const files: Record<string, string> = {};
  let updatedAt = 0;
  async function walk(path: string) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const full = join(path, entry.name);
      if (entry.isDirectory()) await walk(full);
      else {
        const name = relative(dir, full);
        if (isTetrastackFile(name)) files[name] = await readFile(full, "utf8");
      }
    }
  }
  await walk(dir);
  updatedAt = Date.now();
  return { sha: "local", updatedAt, origin: "local", files };
}

const cachedFiles = unstable_cache(fetchFromGitHub, ["tetrastack-files-v1"], {
  revalidate: 3600,
  tags: [TETRASTACK_TAG],
});

export async function getTetrastackFiles(): Promise<TetrastackFiles> {
  const dir = process.env.TETRASTACK_DIR;
  if (dir) return readLocal(dir.replace(/^~/, process.env.HOME ?? "~"));
  try {
    return await cachedFiles();
  } catch (error) {
    console.error("tetrastack: serving the vendored snapshot", error);
    return snapshot as TetrastackFiles;
  }
}

export async function getTetrastack(): Promise<Tetrastack> {
  return parseTetrastack(await getTetrastackFiles());
}
