// Read-only pico/local import. All source records and reports stay in the private
// content repository; the public site remains on pico until explicit cutover.
import { execFileSync } from "node:child_process";
import {
  mkdir,
  readdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { getSchema } from "@tiptap/core";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { parseDocument } from "yaml";
import {
  assetIds,
  defaultPost,
  postSummary,
  serializePost,
  type WritingEntry,
  type WritingPost,
} from "../../shared/writing";
import {
  writingExtensions,
  writingMarkdown,
} from "../../shared/writing-extensions";
import { parseAtomFeed } from "../../src/lib/blog";
import { digest, GithubWritingGit } from "../../src/lib/writing/git";
import { WritingService } from "../../src/lib/writing/service";
import { completeUpload, prepareUpload } from "../../src/lib/writing/storage";

async function main() {
  process.env.WRITING_LOCAL_CLI = "1";
  process.env.WRITING_GITHUB_TOKEN = execFileSync("gh", ["auth", "token"], {
    encoding: "utf8",
  }).trim();
  process.env.WRITING_REPOSITORY = "Tetraslam/tetraslam-writing";
  for (const [key, field] of Object.entries({
    WRITING_S3_ACCESS_KEY_ID: "access_key_id",
    WRITING_S3_SECRET_ACCESS_KEY: "secret_access_key",
    WRITING_S3_BUCKET: "bucket",
  }))
    process.env[key] = execFileSync(
      "opa",
      ["read", `op://Agents/TETRASLAM_WRITING_STORAGE/${field}`],
      { encoding: "utf8" },
    ).trim();
  const root = await realpath(resolve(process.argv[2]));
  if (!root.includes("/tetraslam-writing/imports/"))
    throw new Error(
      "Choose a preserved snapshot in the private writing repository.",
    );
  const verification = JSON.parse(
    await readFile(join(root, "verification.json"), "utf8"),
  );
  if (!verification.complete)
    throw new Error("Pico inventory has not been verified.");
  const inventory = JSON.parse(
    await readFile(join(root, "inventory.json"), "utf8"),
  ) as { files: Array<{ source: string; origin: string; sha256: string }> };
  const feed = parseAtomFeed(await readFile(join(root, "feed.xml"), "utf8"));
  const overrides: Record<
    string,
    { url?: string; gitRef?: string; contentType: string; filename: string }
  > = JSON.parse(
    await readFile(join(root, "media-overrides.json"), "utf8").catch(
      () => "{}",
    ),
  );
  const service = new WritingService(new GithubWritingGit());
  const media = new Map<string, string>();
  const types: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".avif": "image/avif",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
  };
  const report: {
    capturedAt: string;
    posts: Array<{
      id: string;
      slug: string;
      published: boolean;
      draftSource: string;
      publicationSource?: string;
      sourceHash: string;
    }>;
    errors: string[];
    media: number;
    complete: boolean;
    coverage: Array<{ source: string; id: string; sha256: string }>;
    supportingSources: Array<{
      source: string;
      sha256: string;
      purpose: string;
    }>;
  } = {
    capturedAt: new Date().toISOString(),
    posts: [],
    errors: [],
    media: 0,
    complete: false,
    coverage: [],
    supportingSources: inventory.files
      .filter(
        (file) =>
          file.origin === "local" && file.source.startsWith("scratchpad/"),
      )
      .map((file) => ({
        source: `local/${file.source}`,
        sha256: file.sha256,
        purpose:
          "Research transcript or figure-generation source, preserved verbatim in the private archive; not an authored post.",
      })),
  };
  for (const file of inventory.files) {
    const contentType = types[extname(file.source).toLowerCase()];
    if (!contentType) continue;
    const path = join(
        root,
        file.origin === "pico" ? "pico" : "local",
        file.source,
      ),
      bytes = await readFile(path);
    if (digest(bytes) !== file.sha256)
      throw new Error("A preserved source asset changed.");
    let id = media.get(file.sha256);
    if (!id) {
      const existing = (await service.load()).index.assets[file.sha256];
      if (existing) id = existing.id;
      else {
        const intent = await prepareUpload({
          filename: basename(path),
          contentType,
          size: bytes.length,
          sha256: file.sha256,
        });
        const response = await fetch(intent.url, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: bytes,
        });
        if (!response.ok)
          throw new Error(`Media upload failed (${response.status}).`);
        const { url: _url, ...complete } = intent;
        id = (await completeUpload(service, complete)).id;
      }
      media.set(file.sha256, id);
      report.media++;
      console.log(`verified original ${report.media}`);
    }
    media.set(path, id);
  }
  function identity(value: string) {
    const hex = digest(value);
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
  }
  function frontmatter(source: string) {
    const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!match) return { meta: {} as Record<string, unknown>, body: source };
    const parsed = parseDocument(match[1]);
    if (parsed.errors.length) throw new Error("Invalid source frontmatter.");
    return {
      meta: (parsed.toJS({ maxAliasCount: 0 }) || {}) as Record<
        string,
        unknown
      >,
      body: source.slice(match[0].length),
    };
  }
  async function assetReference(url: string, file: string) {
    let path = url;
    if (/^https?:\/\//.test(url)) {
      const known = media.get(url);
      if (known) return `writing-asset:${known}`;
      const override = overrides[url];
      if (override) {
        let bytes: Buffer;
        const contentType = override.contentType;
        if (override.url) {
          if (!override.url.startsWith("https://"))
            throw new Error("Reviewed remote media must use HTTPS.");
          const response = await fetch(override.url, {
            signal: AbortSignal.timeout(45_000),
          });
          if (
            !response.ok ||
            !response.headers.get("content-type")?.startsWith("image/")
          )
            throw new Error("The external image is unavailable.");
          bytes = Buffer.from(await response.arrayBuffer());
        } else if (override.gitRef)
          bytes = execFileSync("git", ["show", override.gitRef]);
        else throw new Error("The reviewed media override has no source.");
        const sha256 = digest(bytes),
          filename = override.filename;
        let asset = (await service.load()).index.assets[sha256];
        if (!asset) {
          const intent = await prepareUpload({
            filename,
            contentType,
            size: bytes.length,
            sha256,
          });
          const response = await fetch(intent.url, {
            method: "PUT",
            headers: { "Content-Type": contentType },
            body: new Uint8Array(bytes),
          });
          if (!response.ok) throw new Error("External image upload failed.");
          const { url: _url, ...complete } = intent;
          asset = await completeUpload(service, complete);
        }
        await mkdir(join(root, "external-media"), { recursive: true });
        await writeFile(
          join(root, "external-media", `${sha256}${extname(filename)}`),
          bytes,
        );
        media.set(url, asset.id);
        return `writing-asset:${asset.id}`;
      }
      const parsed = new URL(url);
      if (
        !["blog.tetraslam.world", "www.blog.tetraslam.world"].includes(
          parsed.hostname,
        )
      )
        throw new Error(
          `External media needs an explicit import: ${parsed.hostname}`,
        );
      path = decodeURIComponent(parsed.pathname);
    }
    const candidates = path.startsWith("/")
      ? [
          join(root, "pico", path.slice(1)),
          join(root, "local/site/assets", path.slice(1)),
        ]
      : [
          resolve(dirname(file), path),
          join(root, "pico", path),
          join(root, "local/site/assets", path),
          join(root, "local/images", path),
        ];
    for (const candidate of candidates) {
      if (!candidate.startsWith(root + "/")) continue;
      const id = media.get(candidate);
      if (id) return `writing-asset:${id}`;
    }
    throw new Error(`Missing source media in preserved inventory: ${path}`);
  }
  type Ast = {
    type: string;
    url?: string;
    alt?: string;
    title?: string;
    identifier?: string;
    position?: { start: { offset?: number }; end: { offset?: number } };
    children?: Ast[];
  };
  async function convert(
    file: string,
    id: string,
    slug: string,
    fallbackTitle: string,
  ): Promise<WritingPost> {
    const source = await readFile(file, "utf8"),
      { meta, body } = frontmatter(source);
    const changes: Array<{ start: number; end: number; text: string }> = [];
    const tree = unified().use(remarkParse).use(remarkGfm).parse(body) as Ast;
    const images: Ast[] = [],
      definitions = new Map<string, Ast>(),
      references: Ast[] = [];
    function visit(node: Ast) {
      if (node.type === "image") images.push(node);
      if (node.type === "definition" && node.identifier)
        definitions.set(node.identifier, node);
      if (node.type === "imageReference") references.push(node);
      node.children?.forEach(visit);
    }
    visit(tree);
    for (const reference of references) {
      const definition = definitions.get(reference.identifier || "");
      if (!definition?.url)
        throw new Error("Image reference has no definition.");
      images.push({
        ...reference,
        url: definition.url,
        title: definition.title,
      });
    }
    for (const image of images) {
      const target = await assetReference(image.url!, file);
      changes.push({
        start: image.position!.start.offset!,
        end: image.position!.end.offset!,
        text: `![${(image.alt || "").replaceAll("]", "\\]")}](${target}${image.title ? ` ${JSON.stringify(image.title)}` : ""})`,
      });
    }
    for (const match of body.matchAll(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)) {
      const target = await assetReference(match[1], file);
      changes.push({
        start: match.index!,
        end: match.index! + match[0].length,
        text: `![${match[2] || ""}](${target})`,
      });
    }
    // Raw HTML media needs a reviewed transform instead of silently dropping it.
    if (/<(?:img|video|audio|source)\b/i.test(body))
      throw new Error("Raw HTML media needs an explicit import transform.");
    let converted = body;
    for (const change of changes.sort((a, b) => b.start - a.start))
      converted =
        converted.slice(0, change.start) +
        change.text +
        converted.slice(change.end);
    const firstHeading = converted.match(/^\s*#\s+([^\n]+)\n/);
    const title =
      typeof meta.title === "string"
        ? meta.title
        : fallbackTitle || firstHeading?.[1] || slug;
    if (firstHeading && firstHeading[1].trim() === title.trim())
      converted = converted.slice(firstHeading[0].length);
    const date =
      meta.date instanceof Date
        ? meta.date.toISOString()
        : String(meta.date || "");
    const post: WritingPost = {
      ...defaultPost(id),
      title,
      slug,
      summary: typeof meta.description === "string" ? meta.description : "",
      date,
      tags: Array.isArray(meta.tags) ? meta.tags.map(String) : [],
      commentKey: `https://blog.tetraslam.world/${slug}`,
      sourceUrl: `https://blog.tetraslam.world/${slug}`,
      body: converted,
    };
    if (typeof meta.image === "string" && meta.image)
      post.cover = await assetReference(meta.image, file);
    const manager = writingMarkdown(),
      parsed = manager.parse(converted),
      roundtrip = manager.parse(manager.serialize(parsed));
    if (JSON.stringify(parsed) !== JSON.stringify(roundtrip))
      throw new Error("Editor round-trip changed this source document.");
    if (parsed.content?.length)
      getSchema(writingExtensions()).nodeFromJSON(parsed).check();
    serializePost(post);
    return post;
  }
  const candidates: Array<{
    draft: WritingPost;
    publication?: WritingPost;
    note?: string;
  }> = [];
  const usedLocal = new Set<string>();
  const remotePosts = (await readdir(join(root, "pico"))).filter(
    (name) => name.endsWith(".md") && !name.startsWith("_"),
  );
  for (const name of remotePosts) {
    const slug = name.slice(0, -3),
      id = identity(`https://blog.tetraslam.world/${slug}`),
      remote = join(root, "pico", name),
      listed = feed.find((post) => post.slug === slug);
    try {
      const remotePost = await convert(remote, id, slug, listed?.title || "");
      let remoteId = id;
      let draft = remotePost,
        note = "imported from pico";
      const local = inventory.files.find(
        (file) =>
          file.origin === "local" &&
          (file.source === `posts/${slug}/post.md` ||
            file.source === `posts/drafts/${slug}/post.md`),
      );
      if (local) {
        const path = join(root, "local", local.source),
          localPost = await convert(path, id, slug, remotePost.title);
        usedLocal.add(local.source);
        draft = localPost;
        note = "local working copy; pico publication preserved";
        if (
          remotePost.body !== localPost.body ||
          remotePost.title !== localPost.title
        ) {
          const variantId = identity(`${remote}:pico-variant`);
          remoteId = variantId;
          candidates.push({
            draft: {
              ...remotePost,
              id: variantId,
              slug: `${slug.slice(0, 130)}-pico-copy`,
              commentKey: `writing:${variantId}`,
            },
            note: "preserved pico variant alongside a differing local draft",
          });
        }
      }
      const original = frontmatter(await readFile(remote, "utf8"));
      const published = !!listed && original.meta.draft !== true;
      if (published) {
        remotePost.date = listed!.published;
        remotePost.commentKey = listed!.id;
        draft.commentKey = listed!.id;
      }
      candidates.push({
        draft,
        publication: published ? remotePost : undefined,
        note,
      });
      report.coverage.push({
        source: `pico/${name}`,
        id: remoteId,
        sha256: digest(await readFile(remote)),
      });
      if (local)
        report.coverage.push({
          source: `local/${local.source}`,
          id,
          sha256: local.sha256,
        });
      report.posts.push({
        id,
        slug,
        published,
        draftSource: local?.source || `pico/${name}`,
        publicationSource: published ? `pico/${name}` : undefined,
        sourceHash: digest(await readFile(remote)),
      });
    } catch (error) {
      report.errors.push(`${name}: ${(error as Error).message}`);
    }
  }
  for (const file of inventory.files.filter(
    (file) =>
      file.origin === "local" &&
      /^posts\/.*\/post\.md$/.test(file.source) &&
      !usedLocal.has(file.source),
  )) {
    const id = identity(`local:${file.source}`),
      slug = `draft-${id.slice(0, 8)}`;
    try {
      const draft = await convert(
        join(root, "local", file.source),
        id,
        slug,
        "",
      );
      draft.commentKey = `writing:${id}`;
      draft.sourceUrl = "";
      candidates.push({ draft, note: "imported local-only draft" });
      report.coverage.push({
        source: `local/${file.source}`,
        id,
        sha256: file.sha256,
      });
      report.posts.push({
        id,
        slug,
        published: false,
        draftSource: file.source,
        sourceHash: file.sha256,
      });
    } catch (error) {
      report.errors.push(`${file.source}: ${(error as Error).message}`);
    }
  }
  // Older generated copies and archived writing remain accessible in the desk.
  // Exact converted matches share a document; differing versions stay private.
  function contentKey(post: WritingPost) {
    return JSON.stringify([
      post.title,
      post.body,
      post.summary,
      post.date,
      post.tags,
      post.cover,
    ]);
  }
  for (const file of inventory.files.filter(
    (file) =>
      file.origin === "local" &&
      /^(blog|archive)\/.+\.md$/.test(file.source) &&
      !basename(file.source).startsWith("_"),
  )) {
    const id = identity(`local:${file.source}`),
      slug = `draft-${id.slice(0, 8)}`;
    try {
      const originalSlug = basename(file.source, ".md");
      const matching = candidates.find(
        (candidate) => candidate.draft.slug === originalSlug,
      );
      const draft = await convert(
        join(root, "local", file.source),
        id,
        slug,
        matching?.draft.title || "",
      );
      const equivalent = candidates.find(
        (candidate) => contentKey(candidate.draft) === contentKey(draft),
      );
      report.coverage.push({
        source: `local/${file.source}`,
        id: equivalent?.draft.id || id,
        sha256: file.sha256,
      });
      if (equivalent) continue;
      draft.commentKey = `writing:${id}`;
      draft.sourceUrl = "";
      candidates.push({ draft, note: "preserved local archive variant" });
      report.posts.push({
        id,
        slug,
        published: false,
        draftSource: file.source,
        sourceHash: file.sha256,
      });
    } catch (error) {
      report.errors.push(`${file.source}: ${(error as Error).message}`);
    }
  }
  if (report.errors.length) {
    await writeFile(
      join(
        root,
        process.argv.includes("--check")
          ? "coverage-plan.json"
          : "migration-report.json",
      ),
      JSON.stringify(report, null, 2) + "\n",
    );
    console.log(
      JSON.stringify({
        complete: false,
        errors: report.errors.length,
        report: join(root, "migration-report.json"),
      }),
    );
    process.exitCode = 1;
  } else {
    if (process.argv.includes("--check")) {
      await writeFile(
        join(root, "coverage-plan.json"),
        `${JSON.stringify(report, null, 2)}\n`,
      );
      console.log(
        JSON.stringify({
          complete: true,
          candidates: candidates.length,
          coveredSources: report.coverage.length,
          published: feed.length,
          applied: false,
        }),
      );
      return;
    }
    const loaded = await service.load(),
      files: Record<string, string> = {};
    for (const candidate of candidates) {
      const draft = serializePost(candidate.draft),
        id = candidate.draft.id,
        path = `writing/drafts/${id}.md`,
        existing = await service.git.read(path, loaded.snapshot.head);
      if (existing && digest(existing) !== digest(draft))
        throw new Error(
          "An imported draft has been edited; refusing to overwrite it.",
        );
      const entry: WritingEntry & { importNote?: string } = {
        id,
        draft: postSummary(candidate.draft),
        draftRevision: digest(draft),
        updatedAt: new Date().toISOString(),
        published: null,
        schedule: null,
        aliases: [],
        importNote: candidate.note,
      };
      files[path] = draft;
      if (candidate.publication) {
        const source = serializePost(candidate.publication),
          revision = digest(source),
          release = `writing/releases/${id}/${revision}.md`;
        files[release] = source;
        entry.firstPublishedAt = candidate.publication.date;
        entry.published = {
          revision,
          path: release,
          meta: postSummary(candidate.publication),
          releasedAt: candidate.publication.date,
          assets: assetIds(candidate.publication),
        };
      }
      if (
        loaded.index.entries[id] &&
        JSON.stringify(loaded.index.entries[id].published) !==
          JSON.stringify(entry.published)
      )
        throw new Error(
          "Publication changed after import; review it before retrying.",
        );
      if (loaded.index.entries[id]) continue;
      loaded.index.entries[id] = entry;
    }
    if (report.posts.filter((post) => post.published).length !== feed.length)
      throw new Error("Published inventory does not match the feed.");
    report.complete = true;
    loaded.index.migration = {
      verified: false,
      report: relative(
        resolve(root, "../.."),
        join(root, "migration-report.json"),
      ),
    };
    files["writing/index.json"] = JSON.stringify(loaded.index, null, 2) + "\n";
    files["writing/migration-report.json"] =
      JSON.stringify(report, null, 2) + "\n";
    const head = await service.git.commit(
      loaded.snapshot,
      files,
      "Import verified pico publications and preserve all draft variants",
    );
    await writeFile(
      join(root, "migration-report.json"),
      JSON.stringify(report, null, 2) + "\n",
    );
    console.log(
      JSON.stringify({
        head,
        complete: true,
        published: feed.length,
        drafts: candidates.filter((x) => !x.publication).length,
        media: report.media,
        cutover: false,
      }),
    );
  }
}
void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Migration failed.");
  process.exitCode = 1;
});
