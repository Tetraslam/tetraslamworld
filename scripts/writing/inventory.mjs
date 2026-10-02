import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFile,
  lstat,
  mkdir,
  readdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { parseDocument } from "yaml";

const destination = resolve(process.argv[2] || "../tetraslam-writing");
const source = resolve(process.argv[3] || "../tetrablog");
const remote = spawnSync("git", ["remote", "get-url", "origin"], {
  cwd: destination,
  encoding: "utf8",
});
if (
  remote.status !== 0 ||
  !remote.stdout.includes("Tetraslam/tetraslam-writing")
)
  throw new Error("Expected the private writing repository.");
const repo = spawnSync(
  "gh",
  ["repo", "view", "Tetraslam/tetraslam-writing", "--json", "isPrivate"],
  { encoding: "utf8" },
);
if (repo.status !== 0 || !JSON.parse(repo.stdout).isPrivate)
  throw new Error("Destination must be private.");
const snapshot = join(
  destination,
  "imports",
  new Date().toISOString().replaceAll(":", "-"),
);
const pico = join(snapshot, "pico");
await mkdir(pico, { recursive: true });
const download = spawnSync(
  "sftp",
  ["-q", "-b", "-", "-o", "BatchMode=yes", "prose.sh"],
  {
    input: `lcd "${pico}"\nget /*\n`,
    encoding: "utf8",
    timeout: 300_000,
    maxBuffer: 4 * 1024 * 1024,
  },
);
if (download.status !== 0)
  throw new Error(
    `Pico read-only download failed (${download.status}): ${download.stderr}`,
  );
const manifest = [];
async function collect(dir, copyTo) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (item.name === ".git" || item.name === "__pycache__") continue;
    const path = join(dir, item.name),
      info = await lstat(path);
    if (info.isSymbolicLink())
      throw new Error("Source snapshot contains a symlink.");
    if (info.isDirectory()) {
      if (copyTo) await mkdir(join(copyTo, item.name), { recursive: true });
      await collect(path, copyTo && join(copyTo, item.name));
      continue;
    }
    const bytes = await readFile(path);
    if (copyTo) await copyFile(path, join(copyTo, item.name));
    const record = {
      source: relative(copyTo ? source : pico, path),
      origin: copyTo ? "local" : "pico",
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
    if (item.name.endsWith(".md")) {
      const text = bytes.toString("utf8");
      const front = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
      const doc = front ? parseDocument(front[1]) : null;
      if (doc?.errors.length) record.frontmatterError = true;
      else {
        const data = doc?.toJS({ maxAliasCount: 0 }) || {};
        record.draft = data.draft === true;
        record.date = String(data.date || "");
        record.title = String(data.title || "");
      }
    }
    manifest.push(record);
  }
}
await collect(pico);
for (const name of [
  "posts",
  "blog",
  "images",
  "site",
  "archive",
  "scratchpad",
]) {
  try {
    await lstat(join(source, name));
  } catch {
    continue;
  }
  const target = join(snapshot, "local", name);
  await mkdir(target, { recursive: true });
  await collect(join(source, name), target);
}
const feed = await fetch("https://blog.tetraslam.world/rss");
if (!feed.ok) throw new Error("Could not capture current feed.");
await writeFile(join(snapshot, "feed.xml"), await feed.text());
await writeFile(
  join(snapshot, "inventory.json"),
  JSON.stringify(
    {
      schema: 1,
      capturedAt: new Date().toISOString(),
      sourceHead: spawnSync("git", ["rev-parse", "HEAD"], {
        cwd: source,
        encoding: "utf8",
      }).stdout.trim(),
      files: manifest,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    snapshot,
    files: manifest.length,
    pico: manifest.filter((x) => x.origin === "pico").length,
    remoteDrafts: manifest.filter((x) => x.origin === "pico" && x.draft).length,
    frontmatterErrors: manifest.filter((x) => x.frontmatterError).length,
  }),
);
