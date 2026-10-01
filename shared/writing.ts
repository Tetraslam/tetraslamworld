import { z } from "zod";
import { parseDocument, stringify } from "yaml";

export const WRITING_LIMITS = { documentBytes: 1_000_000, uploadBytes: 512 * 1024 * 1024, assets: 300, posts: 10_000 };
export const writingId = z.string().regex(/^[a-z0-9][a-z0-9_-]{7,79}$/);
export const writingRevision = z.string().regex(/^[a-f0-9]{64}$/);
const labels = z.array(z.string().trim().min(1).max(80)).max(50);
const date = z.string().refine(v => v==="" || Number.isFinite(Date.parse(v)), "Use a valid date.");
export const postSchema = z.object({
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
}).strict();
export type WritingPost = z.infer<typeof postSchema>;
export type PostSummary = Omit<WritingPost, "body" | "schema">;
export type Publication = { revision: string; path: string; meta: PostSummary; releasedAt: string; assets: string[] };
export type Schedule = { id: string; at: string; revision: string; path: string; expectedPublication: string | null };
export type WritingEntry = { id: string; draft: PostSummary; draftRevision: string; updatedAt: string; firstPublishedAt?:string; published: Publication | null; schedule: Schedule | null; aliases: string[] };
export type WritingIndex = { schema: 1; entries: Record<string, WritingEntry>; assets: Record<string, WritingAsset>; migration: { verified: boolean; report?: string } };
export type WritingAsset = { id: string; sha256: string; key: string; filename: string; contentType: string; size: number; backup: { releaseId: number; assetId: number; digest: string }; createdAt: string };

export function emptyWritingIndex(): WritingIndex {
  return { schema:1,entries:{},assets:{},migration:{verified:false} };
}
export function postSummary({body: _body,schema: _schema,...meta}: WritingPost): PostSummary {return meta;}
export function defaultPost(id:string,kind:WritingPost["kind"]="essay"):WritingPost {
  return {schema:1,id,kind,title:"",slug:`${kind}-${id.slice(0,8)}`,summary:"",date:"",tags:[],topics:[],series:"",cover:"",commentKey:`writing:${id}`,sourceUrl:"",body:""};
}
export function serializePost(input:WritingPost) {
  const {body,...metadata}=postSchema.parse(input);
  const source=`---\n${stringify(metadata,{lineWidth:0})}---\n\n${body.replace(/^\n+/,"")}`;
  if(new TextEncoder().encode(source).byteLength>WRITING_LIMITS.documentBytes)throw new Error("This post exceeds the 1 MB document limit.");
  return source;
}
export function parsePost(source:string):WritingPost {
  if(new TextEncoder().encode(source).byteLength>WRITING_LIMITS.documentBytes)throw new Error("Document exceeds the limit.");
  const match=source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n(?:\r?\n)?([\s\S]*)$/);
  if(!match)throw new Error("Missing writing frontmatter.");
  const doc=parseDocument(match[1]);
  if(doc.errors.length)throw new Error("Invalid frontmatter.");
  return postSchema.parse({...doc.toJS({maxAliasCount:0}),body:match[2]});
}
export function writingTitle(post: Pick<WritingPost,"title"|"body"|"kind">) {
  return post.title.trim() || post.body.replace(/```[\s\S]*?```/g,"").replace(/[#*_`>\[\]]/g,"").trim().split("\n")[0]?.slice(0,100) || (post.kind==="note"?"untitled note":"untitled draft");
}
export function assetIds(post:WritingPost):string[] {
  return [...new Set((post.body+" "+post.cover).match(/writing-asset:[a-f0-9]{64}/g)??[])].map(s=>s.slice("writing-asset:".length));
}
export function mediaUrl(value:string) {return value.startsWith("writing-asset:")?`/api/writing/media/${value.slice(14)}`:value;}
export type WritingBlock = {type:string;version?:number;[key:string]:unknown};
export function encodeBlock(block:WritingBlock) {return `\n\n\`\`\`writing\n${JSON.stringify(block,null,2)}\n\`\`\`\n\n`;}
export function decodeBlock(raw:string):WritingBlock | null {
  try {const value=JSON.parse(raw);return value && typeof value==="object" && typeof value.type==="string" ? value : null;}catch{return null;}
}
export function searchablePost(post:WritingPost) {
  return [post.title,post.summary,...post.tags,...post.topics,post.series,post.body].join("\n").toLocaleLowerCase();
}
