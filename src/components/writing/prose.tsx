"use client";

import { useState } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import {
  decodeBlock,
  mediaUrl,
  type WritingBlock,
  type WritingPost,
  writingTitle,
} from "../../../shared/writing";
import { alignWritingAnchors } from "../../../shared/writing-hast";
import { StationSpacing } from "./visualizations";

const schema = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    src: [...(defaultSchema.protocols?.src || []), "writing-asset"],
    href: [...(defaultSchema.protocols?.href || []), "writing-asset"],
  },
};
function text(value: unknown) {
  return typeof value === "string" ? value : "";
}
function href(value: unknown) {
  return defaultUrlTransform(mediaUrl(text(value)));
}
function number(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}
export function WritingProse({ body }: { body: string }) {
  return (
    <div className="writing-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, schema],
          alignWritingAnchors,
          [rehypeKatex, { trust: false, throwOnError: false, maxExpand: 1000 }],
        ]}
        urlTransform={(url) => defaultUrlTransform(mediaUrl(url))}
        components={{
          pre: ({ children }) => (
            <div className="writing-code-container">{children}</div>
          ),
          code: ({ className, children }) =>
            className?.includes("language-writing") ? (
              <WritingBlockView raw={String(children).replace(/\n$/, "")} />
            ) : (
              <code className={className}>{children}</code>
            ),
          img: ({ src, alt, title }) => (
            <img src={src} alt={alt || ""} title={title} loading="lazy" />
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
function Caption({ block }: { block: WritingBlock }) {
  return block.caption || block.credit ? (
    <figcaption>
      {text(block.caption)}
      {Boolean(block.credit) && (
        <span>
          {block.caption ? " · " : ""}
          {block.creditUrl ? (
            <a href={href(block.creditUrl)} rel="noreferrer">
              {text(block.credit)}
            </a>
          ) : (
            text(block.credit)
          )}
        </span>
      )}
    </figcaption>
  ) : null;
}
function Animated({ block }: { block: WritingBlock }) {
  const [playing, setPlaying] = useState(false);
  return (
    <>
      <div className="writing-animation">
        {(playing ? block.src : block.poster) ? (
          <img
            src={href(playing ? block.src : block.poster)}
            alt={text(block.alt)}
            loading="lazy"
          />
        ) : (
          <p>{text(block.alt) || "animation"}</p>
        )}
      </div>
      <button
        type="button"
        className="text-action"
        onClick={() => setPlaying(!playing)}
      >
        {playing ? "pause animation" : "play animation"}
      </button>
    </>
  );
}
export function WritingBlockView({ raw }: { raw: string }) {
  const block = decodeBlock(raw);
  if (!block) return <pre className="writing-unknown">{raw}</pre>;
  if (block.type === "image")
    return (
      <figure>
        {block.animated ? (
          <Animated block={block} />
        ) : (
          <a href={href(block.src)} target="_blank" rel="noreferrer">
            <img src={href(block.src)} alt={text(block.alt)} loading="lazy" />
          </a>
        )}
        <Caption block={block} />
      </figure>
    );
  if (block.type === "gallery" && Array.isArray(block.items))
    return (
      <figure>
        <div className="writing-gallery">
          {block.items.map((item, index) =>
            typeof item === "object" && item ? (
              <WritingBlockView
                key={text(item.id) || String(index)}
                raw={JSON.stringify({ ...item, type: "image" })}
              />
            ) : null,
          )}
        </div>
        <Caption block={block} />
      </figure>
    );
  if (block.type === "video" || block.type === "audio")
    return (
      <figure>
        {block.type === "video" ? (
          // biome-ignore lint/a11y/useMediaCaption: Authors can attach a captions track or transcript; silent clips need neither.
          <video
            src={href(block.src)}
            poster={href(block.poster) || undefined}
            controls
            playsInline
            preload="metadata"
            aria-label={text(block.alt) || "video"}
          >
            {Boolean(block.captions) && (
              <track
                kind="captions"
                src={href(block.captions)}
                srcLang={text(block.language) || "en"}
              />
            )}
          </video>
        ) : (
          // biome-ignore lint/a11y/useMediaCaption: The authored transcript is rendered immediately below the native audio player.
          <audio
            src={href(block.src)}
            controls
            preload="none"
            aria-label={text(block.alt) || "audio"}
          />
        )}
        <Caption block={block} />
        {Boolean(block.transcript) && (
          <details>
            <summary>transcript</summary>
            <WritingProse body={text(block.transcript)} />
          </details>
        )}
      </figure>
    );
  if (block.type === "reference")
    return (
      <aside className="writing-reference">
        <a href={href(block.href)}>{text(block.label) || "related entry"} →</a>
        {Boolean(block.description) && <p>{text(block.description)}</p>}
      </aside>
    );
  if (block.type === "interactive")
    return (
      <figure>
        {block.name === "station-spacing" && block.version === 1 ? (
          <StationSpacing
            initialSpacing={number(block.spacing)}
            distance={number(block.distance)}
            speed={number(block.speed)}
            dwell={number(block.dwell)}
          />
        ) : (
          <p>
            {text(block.fallback) ||
              "An interactive example is unavailable in this version."}
          </p>
        )}
        {Boolean(block.fallback) && (
          <details>
            <summary>text alternative</summary>
            <WritingProse body={text(block.fallback)} />
          </details>
        )}
        <Caption block={block} />
      </figure>
    );
  return (
    <aside className="writing-unknown">
      <p>
        {text(block.fallback) ||
          `This ${block.type} block is preserved but is not supported by this version.`}
      </p>
    </aside>
  );
}
export function WritingArticle({
  post,
  preview = false,
}: {
  post: WritingPost;
  preview?: boolean;
}) {
  const date = post.date ? new Date(post.date) : null;
  return (
    <article className="writing-article">
      <header>
        {post.title ? (
          <h1>{post.title}</h1>
        ) : (
          <h1 className="sr-only">{writingTitle(post)}</h1>
        )}
        <div className="writing-byline">
          {preview && <span>private preview</span>}
          {date && (
            <time dateTime={post.date}>
              {date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                ...(post.date.length === 10 ? { timeZone: "UTC" } : {}),
              })}
            </time>
          )}
          {post.series && (
            <a href={`/blog?series=${encodeURIComponent(post.series)}`}>
              {post.series}
            </a>
          )}
        </div>
      </header>
      <WritingProse body={post.body} />
      {(post.tags.length > 0 || post.topics.length > 0) && (
        <footer className="writing-tags">
          {post.topics.map((topic) => (
            <a
              key={`topic-${topic}`}
              href={`/blog?topic=${encodeURIComponent(topic)}`}
            >
              {topic}
            </a>
          ))}
          {post.tags.map((tag) => (
            <a key={`tag-${tag}`} href={`/blog?tag=${encodeURIComponent(tag)}`}>
              {tag}
            </a>
          ))}
        </footer>
      )}
    </article>
  );
}
