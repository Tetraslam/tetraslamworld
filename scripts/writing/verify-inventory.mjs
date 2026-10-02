import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const snapshot = resolve(process.argv[2]);
const inventory = JSON.parse(
  await readFile(join(snapshot, "inventory.json"), "utf8"),
);
const expected = inventory.files.filter((file) => file.origin === "pico");
const temp = await mkdtemp(join(tmpdir(), "writing-inventory-"));
try {
  const transfer = spawnSync(
    "sftp",
    ["-q", "-b", "-", "-o", "BatchMode=yes", "prose.sh"],
    {
      input: `ls -1 /\nlcd "${temp}"\nget /*\n`,
      encoding: "utf8",
      timeout: 300_000,
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  if (transfer.status !== 0)
    throw new Error("Pico verification download failed.");
  const listed = transfer.stdout
    .split("\n")
    .filter((line) => line.startsWith("/") && !line.includes(" "))
    .map((line) => line.slice(1));
  const names = await readdir(temp);
  const expectedNames = new Set(expected.map((file) => file.source));
  const changed = [],
    missing = expected
      .filter((file) => !names.includes(file.source))
      .map((file) => file.source),
    added = names.filter((name) => !expectedNames.has(name));
  for (const file of expected) {
    if (missing.includes(file.source)) continue;
    const bytes = await readFile(join(temp, file.source));
    if (createHash("sha256").update(bytes).digest("hex") !== file.sha256)
      changed.push(file.source);
  }
  const report = {
    verifiedAt: new Date().toISOString(),
    complete: !missing.length && !added.length && !changed.length,
    downloaded: names.length,
    listed: listed.length,
    uniqueListed: new Set(listed).size,
    missing,
    added,
    changed,
  };
  if (new Set(listed).size !== names.length) report.complete = false;
  await writeFile(
    join(snapshot, "verification.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      complete: report.complete,
      files: names.length,
      duplicates: listed.length - new Set(listed).size,
      missing: missing.length,
      added: added.length,
      changed: changed.length,
    }),
  );
  if (!report.complete) process.exitCode = 1;
} finally {
  await rm(temp, { recursive: true, force: true });
}
