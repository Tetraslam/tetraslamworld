/**
 * Refreshes the vendored tetrastack snapshot the taste page falls back to
 * when GitHub is unreachable. The live page doesn't depend on it.
 *
 *   pnpm tetrastack:snapshot
 */
import { writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { untar } from "../shared/tar";
import { isTetrastackFile, TETRASTACK_REPO } from "../shared/tetrastack";

const response = await fetch(
  `https://codeload.github.com/${TETRASTACK_REPO}/tar.gz/refs/heads/main`,
);
if (!response.ok) throw new Error(`archive: ${response.status}`);
const archive = untar(gunzipSync(new Uint8Array(await response.arrayBuffer())));
const files: Record<string, string> = {};
for (const path of Object.keys(archive.files).sort())
  if (isTetrastackFile(path))
    files[path] = new TextDecoder().decode(archive.files[path]);
const out = new URL("../src/lib/tetrastack/snapshot.json", import.meta.url);
await writeFile(
  out,
  `${JSON.stringify(
    {
      sha: archive.commit,
      updatedAt: archive.mtime,
      origin: "snapshot",
      files,
    },
    null,
    2,
  )}\n`,
);
console.log(
  `snapshot ${archive.commit?.slice(0, 7)}: ${Object.keys(files).length} files`,
);
