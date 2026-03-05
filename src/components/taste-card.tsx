"use client";

import { track } from "@vercel/analytics";
import Image from "next/image";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface TasteItem {
  _id: string;
  title: string;
  url: string;
  content?: string;
  designNotes?: string;
  screenshotUrls?: string[];
  tags?: string[];
  order?: number;
  createdAt: number;
}

export function TasteCard({
  item,
  delay = 0,
}: {
  item: TasteItem;
  delay?: number;
}) {
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const screenshots = item.screenshotUrls ?? [];

  let domain = "";
  try {
    domain = new URL(item.url).hostname.replace("www.", "");
  } catch {
    domain = item.url;
  }

  const isGif = (url: string) =>
    url.toLowerCase().endsWith(".gif") ||
    url.toLowerCase().includes("format=gif");

  return (
    <div
      className="bg-surface border border-border rounded-lg overflow-hidden hover:border-rose/30 transition-all group animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Screenshot section */}
      {screenshots.length > 0 ? (
        <div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              track("taste_click", {
                title: item.title,
                url: item.url,
                domain,
              })
            }
            className="block relative aspect-video bg-background overflow-hidden"
          >
            <Image
              src={screenshots[activeScreenshot]}
              alt={`${item.title} screenshot`}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
              unoptimized={isGif(screenshots[activeScreenshot])}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </a>

          {/* Thumbnail strip */}
          {screenshots.length > 1 && (
            <div className="flex gap-1.5 px-3 py-2 overflow-x-auto bg-surface border-t border-border">
              {screenshots.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveScreenshot(i)}
                  className={`relative w-12 h-9 rounded overflow-hidden shrink-0 border-2 transition-colors ${
                    i === activeScreenshot
                      ? "border-rose"
                      : "border-border hover:border-rose/30"
                  }`}
                >
                  <Image
                    src={url}
                    alt={`${item.title} thumbnail ${i + 1}`}
                    fill
                    className="object-cover"
                    unoptimized={isGif(url)}
                    sizes="48px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            track("taste_click", {
              title: item.title,
              url: item.url,
              domain,
            })
          }
          className="block aspect-video bg-background flex items-center justify-center"
        >
          <span className="text-muted-foreground/40 text-sm font-mono">
            {domain}
          </span>
        </a>
      )}

      {/* Content section */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                track("taste_click", {
                  title: item.title,
                  url: item.url,
                  domain,
                })
              }
              className="group/link inline-flex items-center gap-1.5"
            >
              <h3 className="font-medium text-lg text-rose group-hover/link:text-rose-deep transition-colors truncate">
                {item.title}
              </h3>
              <span className="text-muted-foreground group-hover/link:text-rose group-hover/link:translate-x-0.5 transition-all text-sm shrink-0">
                &rarr;
              </span>
            </a>
            <p className="text-xs text-muted-foreground">{domain}</p>
          </div>
        </div>

        {item.content && (
          <div className="text-sm text-muted-foreground line-clamp-4">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-1 last:mb-0">{children}</p>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-rose-deep hover:text-rose underline underline-offset-2 transition-colors"
                  >
                    {children}
                  </a>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">
                    {children}
                  </strong>
                ),
                code: ({ children }) => (
                  <code className="px-1 py-0.5 bg-background rounded text-rose text-xs font-mono">
                    {children}
                  </code>
                ),
              }}
            >
              {item.content}
            </ReactMarkdown>
          </div>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-background rounded border border-border text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* "for claudes" section */}
      {item.designNotes && (
        <div className="border-t border-dashed border-rose/20">
          {/* Desktop: always visible */}
          <div className="hidden md:block p-4">
            <p className="text-xs text-rose/60 font-mono mb-2">for claudes</p>
            <div className="bg-background/50 rounded p-3 text-xs font-mono text-muted-foreground leading-relaxed">
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-1.5 last:mb-0">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-0.5">
                      {children}
                    </ul>
                  ),
                  li: ({ children }) => <li>{children}</li>,
                  code: ({ children }) => (
                    <code className="px-1 py-0.5 bg-surface rounded text-rose text-[10px]">
                      {children}
                    </code>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-foreground font-semibold">
                      {children}
                    </strong>
                  ),
                }}
              >
                {item.designNotes}
              </ReactMarkdown>
            </div>
          </div>

          {/* Mobile: collapsible */}
          <details className="md:hidden group/details">
            <summary className="px-4 py-2 text-xs text-rose/60 font-mono cursor-pointer hover:text-rose/80 transition-colors list-none flex items-center gap-1">
              <span className="group-open/details:rotate-90 transition-transform text-[10px]">
                &#9654;
              </span>
              for claudes
            </summary>
            <div className="px-4 pb-4">
              <div className="bg-background/50 rounded p-3 text-xs font-mono text-muted-foreground leading-relaxed">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="mb-1.5 last:mb-0">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-0.5">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => <li>{children}</li>,
                    code: ({ children }) => (
                      <code className="px-1 py-0.5 bg-surface rounded text-rose text-[10px]">
                        {children}
                      </code>
                    ),
                    strong: ({ children }) => (
                      <strong className="text-foreground font-semibold">
                        {children}
                      </strong>
                    ),
                  }}
                >
                  {item.designNotes}
                </ReactMarkdown>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
