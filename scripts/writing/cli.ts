import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  mkdir,
  readdir,
  readFile,
  realpath,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import {
  parsePost,
  serializePost,
  type WritingAsset,
  type WritingIndex,
} from "../../shared/writing";
import { digest, GithubWritingGit } from "../../src/lib/writing/git";
import { WritingService } from "../../src/lib/writing/service";
import {
  completeUpload,
  prepareUpload,
  readOriginal,
  fetchBackupOriginal,
} from "../../src/lib/writing/storage";

process.env.WRITING_LOCAL_CLI = "1";
process.env.WRITING_GITHUB_TOKEN = execFileSync("gh", ["auth", "token"], {
  encoding: "utf8",
}).trim();
process.env.WRITING_REPOSITORY ||= "Tetraslam/tetraslam-writing";
const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    expected: { type: "string" },
    at: { type: "string" },
    output: { type: "string" },
    from: { type: "string" },
    new: { type: "boolean" },
    apply: { type: "boolean" },
    branch: { type: "string" },
  },
});
if (values.branch) process.env.WRITING_BRANCH = values.branch;
const git = new GithubWritingGit(),
  service = new WritingService(git);
const [command, arg] = positionals;
const print = (value: unknown) => console.log(JSON.stringify(value, null, 2));
function storageCredentials() {
  for (const [key, field] of Object.entries({
    WRITING_S3_ACCESS_KEY_ID: "access_key_id",
    WRITING_S3_SECRET_ACCESS_KEY: "secret_access_key",
    WRITING_S3_BUCKET: "bucket",
  }))
    process.env[key] ||= execFileSync(
      "opa",
      ["read", `op://Agents/TETRASLAM_WRITING_STORAGE/${field}`],
      { encoding: "utf8" },
    ).trim();
  process.env.WRITING_S3_ENDPOINT ||= "https://t3.storage.dev";
}
async function privateDirectory(path: string) {
  const target = resolve(path),
    root = await realpath(process.cwd());
  let parent = target;
  while (true) {
    try {
      parent = await realpath(parent);
      break;
    } catch {
      const next = dirname(parent);
      if (next === parent) throw new Error("No parent directory.");
      parent = next;
    }
  }
  if (parent === root || parent.startsWith(root + "/"))
    throw new Error(
      "Exports must be outside the public application repository.",
    );
  try {
    if ((await readdir(target)).length)
      throw new Error("Choose a new, empty export directory.");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  await mkdir(target, { recursive: true, mode: 0o700 });
  return target;
}
async function writeAsset(asset: WritingAsset, path: string) {
  let bytes:Uint8Array;
  try{const original=await readOriginal(asset);if(!original.Body||original.ContentLength!==asset.size)throw new Error("Missing or changed original.");bytes=await original.Body.transformToByteArray();if(digest(bytes)!==asset.sha256)throw new Error("Primary checksum mismatch.");}
  catch{bytes=new Uint8Array(await(await fetchBackupOriginal(asset)).arrayBuffer());}
  if(digest(bytes)!==asset.sha256||bytes.byteLength!==asset.size)throw new Error(`Original and backup verification failed: ${asset.id}`);
  await writeFile(path, bytes, { mode: 0o600 });
}
async function main() {
  const repo = JSON.parse(
    execFileSync(
      "gh",
      ["repo", "view", process.env.WRITING_REPOSITORY!, "--json", "isPrivate"],
      { encoding: "utf8" },
    ),
  );
  if (!repo.isPrivate)
    throw new Error("Writing requires a private repository.");
  if (command === "list") return print(await service.list(arg || ""));
  if (command === "read") return print(await service.readDraft(arg));
  if (command === "history") return print(await service.history(arg));
  if (command === "save") {
    const post = parsePost(await readFile(resolve(arg), "utf8"));
    if (!values.new && !values.expected)
      throw new Error(
        "Pass --expected with the revision read before editing, or --new for a new draft.",
      );
    return print(
      await service.save({
        id: post.id,
        post,
        operationId: randomUUID(),
        expectedRevision: values.new ? null : values.expected!,
      }),
    );
  }
  if (
    command === "publish" ||
    command === "schedule" ||
    command === "unpublish"
  ) {
    const current = await service.readDraft(arg);
    if (!values.apply)
      return print({
        post: current.post,
        revision: current.revision,
        published: current.entry.published,
        schedule: values.at || null,
        apply: false,
      });
    if (values.expected !== current.revision)
      throw new Error(
        "Review the post, then pass its --expected revision and --apply.",
      );
    const input = {
      id: arg,
      operationId: randomUUID(),
      expectedRevision: current.revision,
      expectedPublication: current.entry.published?.revision ?? null,
    };
    if (command === "unpublish") return print(await service.unpublish(input));
    if (command === "schedule" && !values.at)
      throw new Error("Schedule requires --at with an ISO timestamp.");
    return print(await service.publish({ ...input, at: values.at }));
  }
  if (command === "cancel") {
    const current = await service.readDraft(arg);
    if (!current.entry.schedule) throw new Error("No scheduled publication.");
    if (!values.apply) return print(current.entry.schedule);
    return print(
      await service.cancelSchedule({
        id: arg,
        operationId: randomUUID(),
        expectedRevision: current.revision,
        scheduleId: current.entry.schedule.id,
      }),
    );
  }
  if (command === "upload") {
    storageCredentials();
    const file = resolve(arg),
      bytes = await readFile(file),
      extension = file.split(".").pop()?.toLowerCase();
    const types: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      gif: "image/gif",
      svg: "image/svg+xml",
      avif: "image/avif",
      mp4: "video/mp4",
      webm: "video/webm",
      mov: "video/quicktime",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      m4a: "audio/mp4",
    };
    const contentType = types[extension || ""];
    if (!contentType) throw new Error("Unknown media type.");
    const intent = await prepareUpload({
      filename: file.split("/").pop()!,
      size: bytes.length,
      contentType,
      sha256: digest(bytes),
    });
    const response = await fetch(intent.url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: bytes,
    });
    if (!response.ok) throw new Error(`Upload failed (${response.status}).`);
    const { url: _url, ...complete } = intent;
    return print(await completeUpload(service, complete));
  }
  if (command === "export") {
    if (!values.output)
      throw new Error("Provide --output outside the public repo.");
    storageCredentials();
    const output = await privateDirectory(values.output),
      loaded = await service.load();
    execFileSync(
      "git",
      [
        "clone",
        "--mirror",
        `https://github.com/${process.env.WRITING_REPOSITORY}.git`,
        join(output, "content.git"),
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    await mkdir(join(output, "media"), { mode: 0o700 });
    for (const asset of Object.values(loaded.index.assets))
      await writeAsset(asset, join(output, "media", `${asset.id}.original`));
    const codeRevision = execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();
    execFileSync(
      "git",
      ["bundle", "create", join(output, "application.bundle"), "--all"],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    await writeFile(
      join(output, "writing-export.json"),
      JSON.stringify(
        {
          schema: 1,
          createdAt: new Date().toISOString(),
          repository: process.env.WRITING_REPOSITORY,
          head: loaded.snapshot.head,
          codeRevision,
          index: loaded.index,
        },
        null,
        2,
      ) + "\n",
      { mode: 0o600 },
    );
    return print({
      output,
      head: loaded.snapshot.head,
      posts: Object.keys(loaded.index.entries).length,
      assets: Object.keys(loaded.index.assets).length,
    });
  }
  if (command === "verify-export" || command === "restore") {
    const source = resolve(values.from || arg),
      manifest = JSON.parse(
        await readFile(join(source, "writing-export.json"), "utf8"),
      ) as { schema: number; head: string; index: WritingIndex };
    if (manifest.schema !== 1) throw new Error("Unsupported export.");
    execFileSync(
      "git",
      ["--git-dir", join(source, "content.git"), "fsck", "--full"],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    for (const entry of Object.values(manifest.index.entries)) {
      const draft = execFileSync(
        "git",
        [
          "--git-dir",
          join(source, "content.git"),
          "show",
          `${manifest.head}:writing/drafts/${entry.id}.md`,
        ],
        { encoding: "utf8" },
      );
      if (digest(draft) !== entry.draftRevision)
        throw new Error("Draft revision mismatch.");
      parsePost(draft);
      for (const release of [entry.published, entry.schedule])
        if (release) {
          const bytes = execFileSync(
            "git",
            [
              "--git-dir",
              join(source, "content.git"),
              "show",
              `${manifest.head}:${release.path}`,
            ],
            { encoding: "utf8" },
          );
          if (digest(bytes) !== release.revision)
            throw new Error("Release checksum mismatch.");
          parsePost(bytes);
        }
    }
    for (const asset of Object.values(manifest.index.assets)) {
      const bytes = await readFile(
        join(source, "media", `${asset.id}.original`),
      );
      if (digest(bytes) !== asset.sha256 || bytes.length !== asset.size)
        throw new Error("Asset checksum mismatch.");
    }
    if (command === "restore") {
      if (!values.output) throw new Error("Provide a new --output directory.");
      const target = await privateDirectory(values.output);
      execFileSync(
        "git",
        ["clone", join(source, "content.git"), join(target, "content")],
        { stdio: ["ignore", "pipe", "pipe"] },
      );
      execFileSync(
        "git",
        ["-C", join(target, "content"), "checkout", manifest.head],
        { stdio: ["ignore", "pipe", "pipe"] },
      );
      await mkdir(join(target, "media"), { mode: 0o700 });
      for (const asset of Object.values(manifest.index.assets))
        await writeFile(
          join(target, "media", `${asset.id}.original`),
          await readFile(join(source, "media", `${asset.id}.original`)),
          { mode: 0o600 },
        );
      await writeFile(
        join(target, "restore.json"),
        JSON.stringify({ head: manifest.head, index: manifest.index }, null, 2),
        { mode: 0o600 },
      );
      return print({
        restored: true,
        target,
        posts: Object.keys(manifest.index.entries).length,
        assets: Object.keys(manifest.index.assets).length,
      });
    }
    return print({
      verified: true,
      posts: Object.keys(manifest.index.entries).length,
      assets: Object.keys(manifest.index.assets).length,
    });
  }
  throw new Error(
    "Commands: list, read, save, history, publish, schedule, cancel, unpublish, upload, export, verify-export, restore.",
  );
}
void main().catch((error) => {
  console.error(
    JSON.stringify({
      error: error instanceof Error ? error.message : "Writing command failed.",
    }),
  );
  process.exitCode = 1;
});
