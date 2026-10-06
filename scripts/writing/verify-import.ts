import { strict as assert } from "node:assert";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { getSchema } from "@tiptap/core";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { assetIds, parsePost } from "../../shared/writing";
import {
  writingExtensions,
  writingMarkdown,
} from "../../shared/writing-extensions";
import { parseAtomFeed } from "../../src/lib/blog";
import { digest, GithubWritingGit } from "../../src/lib/writing/git";
import { WritingService } from "../../src/lib/writing/service";

type Ast = { type: string; value?: string; alt?: string; children?: Ast[] };
function prose(body: string) {
  const parts: string[] = [];
  const walk = (node: Ast) => {
    if (["text", "code", "inlineCode", "html"].includes(node.type))
      parts.push(node.value || "");
    if (node.type === "image") parts.push(node.alt || "");
    node.children?.forEach(walk);
  };
  walk(unified().use(remarkParse).use(remarkGfm).parse(body) as Ast);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}
function originalBody(source: string, title: string) {
  let body = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  const heading = body.match(/^\s*#\s+([^\n]+)\n/);
  if (heading && heading[1].trim() === title.trim())
    body = body.slice(heading[0].length);
  return body.replace(
    /!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_match, _path, alt) => `![${alt || ""}](original-image)`,
  );
}
async function main() {
  const root = resolve(process.argv[2]);
  const feed = parseAtomFeed(await readFile(join(root, "feed.xml"), "utf8"));
  const service = new WritingService(new GithubWritingGit()),
    { snapshot, index } = await service.load(),
    manager = writingMarkdown(),
    schema = getSchema(writingExtensions());
  const migration = JSON.parse(
    await readFile(join(root, "migration-report.json"), "utf8"),
  ) as {
    complete: boolean;
    coverage: Array<{ source: string; id: string; sha256: string }>;
    supportingSources: Array<{ source: string; sha256: string }>;
  };
  assert(migration.complete);
  assert(migration.coverage.length > 0);
  const imported = new Map<string, ReturnType<typeof parsePost>>();
  let drafts = 0,
    published = 0;
  for (const entry of Object.values(index.entries)) {
    const source = await service.git.read(
      `writing/drafts/${entry.id}.md`,
      snapshot.head,
    );
    assert(source);
    assert.equal(digest(source), entry.draftRevision);
    const draft = parsePost(source);
    imported.set(entry.id, draft);
    assert.equal(draft.id, entry.id);
    const parsed = manager.parse(draft.body);
    const document = parsed.content?.length
      ? schema.nodeFromJSON(parsed)
      : schema.topNodeType.createAndFill();
    assert(document);
    try {
      document.check();
    } catch (error) {
      const bad = new Set<string>();
      document.descendants((node) => {
        if (!node.type.validContent(node.content))
          bad.add(
            `${node.type.name} -> ${node.content.content.map((child) => child.type.name).join(",")}`,
          );
        if (node.marks.length > 1)
          bad.add(node.marks.map((mark) => mark.type.name).join("+"));
      });
      throw new Error(
        `Editor schema mismatch for ${entry.id}: ${(error as Error).message.split(":")[0]}; ${[...bad].join("; ")}`,
      );
    }
    assert.deepEqual(manager.parse(manager.serialize(parsed)), parsed);
    drafts++;
    for (const id of assetIds(draft))
      assert(index.assets[id]?.backup.assetId, `Missing backed-up media ${id}`);
    if (!entry.published) continue;
    const release = await service.git.read(entry.published.path, snapshot.head);
    assert(release);
    assert.equal(digest(release), entry.published.revision);
    const post = parsePost(release);
    const original = feed.find((item) => item.slug === post.slug);
    assert(original);
    assert.equal(post.commentKey, original.id);
    assert.equal(post.date, original.published);
    const pico = await readFile(join(root, "pico", `${post.slug}.md`), "utf8");
    const body = originalBody(pico, post.title);
    assert.equal(
      prose(post.body),
      prose(body),
      `Prose changed during import: ${entry.id}`,
    );
    published++;
  }
  assert.equal(published, feed.length);
  for (const source of migration.coverage) {
    const original = await readFile(join(root, source.source), "utf8");
    assert.equal(digest(original), source.sha256);
    const post = imported.get(source.id);
    assert(post, `Source has no accessible draft: ${source.id}`);
    assert.equal(
      prose(post.body),
      prose(originalBody(original, post.title)),
      `Draft prose changed during import: ${source.id}`,
    );
  }
  for (const source of migration.supportingSources)
    assert.equal(
      digest(await readFile(join(root, source.source))),
      source.sha256,
    );
  const report = {
    verified: true,
    verifiedAt: new Date().toISOString(),
    head: snapshot.head,
    totalDrafts: drafts,
    published,
    privateDrafts: drafts - published,
    assets: Object.keys(index.assets).length,
    checks: [
      "source hashes",
      "editor schema",
      "lossless editor round-trip",
      "backed-up media references",
      "publication identity and dates",
      "published prose parity",
      "all authored source copies mapped to accessible drafts",
      "draft prose parity",
      "supporting research preserved verbatim",
    ],
  };
  await writeFile(
    join(root, "content-verification.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report));
}
void main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Content verification failed",
  );
  process.exitCode = 1;
});
