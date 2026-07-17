"use client";

import { track } from "@vercel/analytics";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { isGif } from "@/lib/media";

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

export function TasteListItem({
  item,
  delay = 0,
}: {
  item: TasteItem;
  delay?: number;
}) {
  const screenshots = item.screenshotUrls ?? [];

  let domain = "";
  try {
    domain = new URL(item.url).hostname.replace("www.", "");
  } catch {
    domain = item.url;
  }

  return (
    <div
      className="bg-surface border border-border rounded-lg hover:border-rose/30 transition-all group animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        {screenshots.length > 0 ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              track("taste_click", { title: item.title, url: item.url, domain })
            }
            className="relative w-32 h-20 sm:w-44 sm:h-28 shrink-0 rounded overflow-hidden bg-background border border-border/50 group-hover:border-rose/20 transition-colors"
          >
            <Image
              src={screenshots[0]}
              alt={`${item.title} screenshot`}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
              unoptimized={isGif(screenshots[0])}
              sizes="176px"
            />
            {screenshots.length > 1 && (
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-background/80 rounded text-[10px] text-muted-foreground font-mono">
                +{screenshots.length - 1}
              </div>
            )}
          </a>
        ) : (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              track("taste_click", { title: item.title, url: item.url, domain })
            }
            className="w-32 h-20 sm:w-44 sm:h-28 shrink-0 rounded bg-background border border-border/50 flex items-center justify-center"
          >
            <span className="text-muted-foreground/30 text-xs font-mono">
              {domain}
            </span>
          </a>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-baseline gap-2 min-w-0">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  track("taste_click", { title: item.title, url: item.url, domain })
                }
                className="group/link inline-flex items-center gap-1.5 min-w-0"
              >
                <h3 className="font-medium text-rose group-hover/link:text-rose-deep transition-colors truncate">
                  {item.title}
                </h3>
                <span className="text-muted-foreground group-hover/link:text-rose group-hover/link:translate-x-0.5 transition-all text-sm shrink-0">
                  &rarr;
                </span>
              </a>
              <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
                {domain}
              </span>
            </div>

            {item.content && (
              <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <span>{children}</span>,
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
                      <strong className="font-semibold text-foreground">{children}</strong>
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
          </div>

          {/* Bottom row: tags + design notes indicator */}
          <div className="flex items-center gap-2 mt-2">
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 text-[10px] bg-background rounded border border-border text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {item.designNotes && (
              <span className="text-[10px] text-rose/50 font-mono shrink-0">
                has design notes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Design notes - collapsed by default in list view */}
      {item.designNotes && (
        <details className="group/details border-t border-dashed border-rose/20">
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
      )}
    </div>
  );
}
