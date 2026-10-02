import { unstable_cache } from "next/cache";
import { cache } from "react";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import {
  type Publication,
  parsePost,
  type WritingAsset,
  assetSchema,
  type WritingPost,
  writingTitle,
} from "../../../shared/writing";
import { escapeXml, portableMarkdown } from "../../../shared/writing-export";
import { alignWritingAnchors } from "../../../shared/writing-hast";
import { digest, GithubWritingGit, WritingError } from "./git";
import { WritingService } from "./service";

export const gitWritingEnabled = () => process.env.WRITING_SOURCE === "git";
const service = new WritingService(new GithubWritingGit());
const publicSnapshot = cache(
  unstable_cache(
    async () => {
      const loaded = await service.load();
      if (!loaded.index.migration.verified)
        throw new WritingError(
          "MIGRATION_INCOMPLETE",
          "The writing archive has not been verified.",
          503,
        );
      const entries = Object.values(loaded.index.entries).flatMap((entry) =>
        entry.published
          ? [
              {
                id: entry.id,
                aliases: entry.aliases,
                published: entry.published,
              },
            ]
          : [],
      );
      const ids = new Set(entries.flatMap((entry) => entry.published.assets));
  return { snapshot: loaded.snapshot, entries, assetIds:[...ids] };
    },
    [
      "writing-public",
      process.env.WRITING_REPOSITORY || "",
      process.env.WRITING_BRANCH || "main",
    ],
    { revalidate: 60, tags: ["writing-public"] },
  ),
);
export async function publicWritingAsset(
  id: string,
): Promise<WritingAsset | undefined> {
  const published=await publicSnapshot();if(!published.assetIds.includes(id))return undefined;
  return unstable_cache(async()=>{const raw=await service.git.read(`writing/assets/${id}.json`,published.snapshot.head);if(raw)return assetSchema.parse(JSON.parse(raw));const index=await service.git.read("writing/index.json",published.snapshot.head);return index?assetSchema.parse(JSON.parse(index).assets[id]):undefined;},["writing-asset",process.env.WRITING_REPOSITORY||"",id],{revalidate:3600})();
}
export async function publicWritingList() {
  const { entries } = await publicSnapshot();
  return entries
    .flatMap((entry) =>
      entry.published
        ? [
            {
              ...entry.published.meta,
              revision: entry.published.revision,
              releasedAt: entry.published.releasedAt,
            },
          ]
        : [],
    )
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}
async function readPublication(publication: Publication, head: string) {
  return unstable_cache(
    async () => {
      const source = await service.git.read(publication.path, head);
      if (!source || digest(source) !== publication.revision)
        throw new WritingError(
          "INVALID_PUBLICATION",
          "The published snapshot failed verification.",
          503,
        );
      return parsePost(source);
    },
    [
      "writing-publication",
      process.env.WRITING_REPOSITORY || "",
      publication.revision,
    ],
    { revalidate: false },
  )();
}
export async function publicWritingPost(slug: string) {
  const { snapshot, entries } = await publicSnapshot();
  const entry = entries.find(
    (item) =>
      item.published &&
      (item.published.meta.slug === slug || item.aliases.includes(slug)),
  );
  if (!entry?.published) return null;
  const post = await readPublication(entry.published, snapshot.head);
  return { post, canonical: post.slug, revision: entry.published.revision };
}
export async function searchPublicWriting(query: string) {
  const { snapshot, entries } = await publicSnapshot();
  const results = [];
  const needle = query.trim().toLocaleLowerCase();
  for (const entry of entries) {
    if (!entry.published) continue;
    const post = await readPublication(entry.published, snapshot.head);
    if (
      !needle ||
      [
        post.title,
        post.summary,
        post.body,
        ...post.tags,
        ...post.topics,
        post.series,
      ]
        .join("\n")
        .toLocaleLowerCase()
        .includes(needle)
    )
      results.push(entry.published.meta);
  }
  return results.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}
export async function staticPostHtml(post: WritingPost) {
  return String(
    await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeSanitize)
      .use(alignWritingAnchors)
      .use(rehypeStringify)
      .process(portableMarkdown(post.body)),
  );
}
export async function writingFeed() {
  const { snapshot, entries } = await publicSnapshot();
  const posts = await Promise.all(
    entries.flatMap((entry) =>
      entry.published ? [readPublication(entry.published, snapshot.head)] : [],
    ),
  );
  posts.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  const items = await Promise.all(
    posts.map(
      async (post) =>
        `<item><title>${escapeXml(writingTitle(post))}</title><link>https://www.tetraslam.world/blog/${escapeXml(post.slug)}</link><guid isPermaLink="false">${escapeXml(post.commentKey)}</guid><pubDate>${new Date(post.date).toUTCString()}</pubDate><description>${escapeXml(await staticPostHtml(post))}</description>${post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join("")}</item>`,
    ),
  );
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>tetraslam’s writing</title><link>https://www.tetraslam.world/blog</link><description>Notes and essays by Shresht Bhowmick.</description>${items.join("")}</channel></rss>`;
}
