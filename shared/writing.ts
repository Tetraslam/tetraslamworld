import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { parseDocument, stringify } from "yaml";
import { z } from "zod";

export const WRITING_LIMITS = {
  documentBytes: 1_000_000,
  uploadBytes: 512 * 1024 * 1024,
  assets: 300,
  posts: 10_000,
};
export const writingId = z.string().regex(/^[a-z0-9][a-z0-9_-]{7,79}$/);
export const writingRevision = z.string().regex(/^[a-f0-9]{64}$/);
const labels = z.array(z.string().trim().min(1).max(80)).max(50);
const date = z
  .string()
  .refine(
    (v) => v === "" || Number.isFinite(Date.parse(v)),
    "Use a valid date.",
  );
export const postSchema = z
  .object({
    schema: z.literal(1),
    id: writingId,
    kind: z.enum(["note", "essay"]),
    title: z.string().max(300),
    slug: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,159}$/),
    summary: z.string().max(1500),
    date,
    tags: labels,
    topics: labels,
    series: z.string().max(120),
    cover: z.string().max(2048),
    commentKey: z.string().max(2048),
    sourceUrl: z.string().max(2048),
    body: z.string().max(WRITING_LIMITS.documentBytes),
  })
  .strict();
export type WritingPost = z.infer<typeof postSchema>;
export type PostSummary = Omit<WritingPost, "body" | "schema">;
export type Publication = {
  revision: string;
  path: string;
  meta: PostSummary;
  releasedAt: string;
  assets: string[];
};
export type Schedule = {
  id: string;
  at: string;
  revision: string;
  path: string;
  expectedPublication: string | null;
};
export type WritingEntry = {
  id: string;
  draft: PostSummary;
  draftRevision: string;
  updatedAt: string;
  firstPublishedAt?: string;
  published: Publication | null;
  schedule: Schedule | null;
  aliases: string[];
};
export type WritingIndex = {
  schema: 1;
  entries: Record<string, WritingEntry>;
  assets: Record<string, WritingAsset>;
  migration: { verified: boolean; report?: string };
};
export type WritingAsset = {
  id: string;
  sha256: string;
  key: string;
  filename: string;
  contentType: string;
  size: number;
  backup: { releaseId: number; assetId: number; digest: string };
  createdAt: string;
};

const summarySchema = postSchema.omit({ body: true, schema: true });
export const assetSchema = z.object({
  id: writingRevision,
  sha256: writingRevision,
  key: z.string().regex(/^originals\/[a-f0-9-]+$/),
  filename: z.string().max(255),
  contentType: z.string().regex(/^(image|video|audio)\/[\w.+-]+$/),
  size: z.number().int().positive().max(WRITING_LIMITS.uploadBytes),
  backup: z.object({
    releaseId: z.number().int().positive(),
    assetId: z.number().int().positive(),
    digest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  }),
  createdAt: date,
});
export const indexSchema = z.object({
  schema: z.literal(1),
  entries: z.record(
    writingId,
    z
      .object({
        id: writingId,
        draft: summarySchema,
        draftRevision: writingRevision,
        updatedAt: date,
        firstPublishedAt: date.optional(),
        published: z
          .object({
            revision: writingRevision,
            path: z
              .string()
              .regex(/^writing\/releases\/[a-z0-9_-]+\/[a-f0-9]{64}\.md$/),
            meta: summarySchema,
            releasedAt: date,
            assets: z.array(writingRevision),
          })
          .nullable(),
        schedule: z
          .object({
            id: z.string().uuid(),
            at: date,
            revision: writingRevision,
            path: z
              .string()
              .regex(/^writing\/releases\/[a-z0-9_-]+\/[a-f0-9]{64}\.md$/),
            expectedPublication: writingRevision.nullable(),
          })
          .nullable(),
        aliases: z.array(z.string().max(200)),
      })
      .passthrough(),
  ),
  assets: z.record(writingRevision, assetSchema),
  migration: z.object({ verified: z.boolean(), report: z.string().optional() }),
});

export type PublicationEvent = {
  id: string;
  action: "publish" | "schedule" | "unpublish" | "cancel" | "scheduled";
  at: string;
  revision: string | null;
  scheduledFor?: string;
};

export function emptyWritingIndex(): WritingIndex {
  return { schema: 1, entries: {}, assets: {}, migration: { verified: false } };
}
export function plainWriting(body: string) {
  return body
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*_`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
export function postSummary({
  body,
  schema: _schema,
  ...meta
}: WritingPost): PostSummary {
  return { ...meta, summary: meta.summary || plainWriting(body).slice(0, 280) };
}
export function defaultPost(
  id: string,
  kind: WritingPost["kind"] = "essay",
): WritingPost {
  return {
    schema: 1,
    id,
    kind,
    title: "",
    slug: `${kind}-${id.slice(0, 8)}`,
    summary: "",
    date: "",
    tags: [],
    topics: [],
    series: "",
    cover: "",
    commentKey: `writing:${id}`,
    sourceUrl: "",
    body: "",
  };
}
export function serializePost(input: WritingPost) {
  const { body, ...metadata } = postSchema.parse(input);
  const source = `---\n${stringify(metadata, { lineWidth: 0 })}---\n\n${body.replace(/^\n+/, "")}`;
  if (
    new TextEncoder().encode(source).byteLength > WRITING_LIMITS.documentBytes
  )
    throw new Error("This post exceeds the 1 MB document limit.");
  return source;
}
export function parsePost(source: string): WritingPost {
  if (
    new TextEncoder().encode(source).byteLength > WRITING_LIMITS.documentBytes
  )
    throw new Error("Document exceeds the limit.");
  const match = source.match(
    /^---\r?\n([\s\S]*?)\r?\n---\r?\n(?:\r?\n)?([\s\S]*)$/,
  );
  if (!match) throw new Error("Missing writing frontmatter.");
  const doc = parseDocument(match[1]);
  if (doc.errors.length) throw new Error("Invalid frontmatter.");
  return postSchema.parse({
    ...doc.toJS({ maxAliasCount: 0 }),
    body: match[2],
  });
}
export function writingTitle(
  post: Pick<WritingPost, "title" | "body" | "kind">,
) {
  return (
    post.title.trim() ||
    post.body
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[#*_`>[\]]/g, "")
      .trim()
      .split("\n")[0]
      ?.slice(0, 100) ||
    (post.kind === "note" ? "untitled note" : "untitled draft")
  );
}
export function assetIds(post: WritingPost): string[] {
  const ids = new Set<string>();
  const add = (value: unknown) => {
    if (typeof value === "string" && /^writing-asset:[a-f0-9]{64}$/.test(value))
      ids.add(value.slice(14));
  };
  type Ast = {
    type: string;
    lang?: string;
    url?: string;
    value?: string;
    identifier?: string;
    children?: Ast[];
  };
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .parse(post.body) as Ast;
  const definitions = new Map<string, string>(),
    references: string[] = [];
  const rich = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    for (const [key, item] of Object.entries(value)) {
      if (["src", "poster", "captions"].includes(key)) add(item);
      else if (Array.isArray(item)) item.forEach(rich);
    }
  };
  const visit = (node: Ast) => {
    if (node.type === "image" || node.type === "link") add(node.url);
    if (node.type === "definition" && node.identifier && node.url)
      definitions.set(node.identifier, node.url);
    if (
      (node.type === "imageReference" || node.type === "linkReference") &&
      node.identifier
    )
      references.push(node.identifier);
    if (node.type === "code" && node.lang === "writing") {
      try {
        rich(JSON.parse(node.value || ""));
      } catch {}
    }
    if (node.type === "html")
      for (const match of (node.value || "").matchAll(
        /(?:src|poster)=["'](writing-asset:[a-f0-9]{64})["']/g,
      ))
        add(match[1]);
    node.children?.forEach(visit);
  };
  visit(tree);
  references.forEach((id) => {
    add(definitions.get(id));
  });
  add(post.cover);
  return [...ids];
}
export function mediaUrl(value: string) {
  return value.startsWith("writing-asset:")
    ? `/api/writing/media/${value.slice(14)}`
    : value;
}
export type WritingBlock = {
  type: string;
  version?: number;
  [key: string]: unknown;
};
export function writingBlocks(body: string): string[] {
  const blocks: string[] = [];
  type Ast = { type: string; lang?: string; value?: string; children?: Ast[] };
  const visit = (node: Ast) => {
    if (node.type === "code" && node.lang === "writing")
      blocks.push(node.value || "");
    node.children?.forEach(visit);
  };
  visit(unified().use(remarkParse).use(remarkGfm).parse(body) as Ast);
  return blocks;
}
export function hasPendingUploads(body: string) {
  return writingBlocks(body).some((raw) => decodeBlock(raw)?.type === "upload");
}
export function encodeBlock(block: WritingBlock) {
  return `\n\n\`\`\`writing\n${JSON.stringify(block, null, 2)}\n\`\`\`\n\n`;
}
export function decodeBlock(raw: string): WritingBlock | null {
  try {
    const value = JSON.parse(raw);
    return value && typeof value === "object" && typeof value.type === "string"
      ? value
      : null;
  } catch {
    return null;
  }
}
export function searchablePost(post: WritingPost) {
  return [
    post.title,
    post.summary,
    ...post.tags,
    ...post.topics,
    post.series,
    post.body,
  ]
    .join("\n")
    .toLocaleLowerCase();
}
