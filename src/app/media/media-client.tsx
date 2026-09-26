"use client";

import { track } from "@vercel/analytics";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { FilterPills } from "@/components/filter-pills";
import { Markdown } from "@/components/markdown";
import { PageHeader } from "@/components/page-header";
import { SectionHeading } from "@/components/section-heading";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { BLUR_DATA_URL, isGif } from "@/lib/media";
import type { api } from "../../../convex/_generated/api";

const typeLabels: Record<string, string> = {
  anime: "anime",
  manga: "manga",
  book: "books",
  game: "games",
  music: "music",
  movie: "movies",
  show: "shows",
  other: "other",
};

const typeOrder = [
  "anime",
  "manga",
  "book",
  "game",
  "music",
  "movie",
  "show",
  "other",
];

interface MediaItem {
  _id: string;
  type: string;
  title: string;
  content?: string;
  imageUrl?: string;
  imageUrls?: string[];
  tags?: string[];
  links?: { label: string; url: string }[];
  showInBoth?: boolean;
  altImageOrder?: number[];
  altOrder?: number;
  // Runtime flag for display
  _displayAsAlt?: boolean;
}

// Helper to get all images for a media item (respecting alternate order if applicable)
function getMediaImages(item: MediaItem): string[] {
  let images: string[] = [];
  if (item.imageUrls && item.imageUrls.length > 0) {
    images = item.imageUrls;
  } else if (item.imageUrl) {
    images = [item.imageUrl];
  }

  // If displaying in alternate section and has custom order, reorder images
  if (
    item._displayAsAlt &&
    item.altImageOrder &&
    item.altImageOrder.length === images.length
  ) {
    return item.altImageOrder.map((idx) => images[idx]);
  }

  return images;
}

export function MediaClient({
  preloadedMedia,
}: {
  preloadedMedia: Preloaded<typeof api.media.list>;
}) {
  const media = usePreloadedQuery(preloadedMedia);
  const [filter, setFilter] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);

  const grouped = media?.reduce(
    (acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);

      // Handle anime/manga crossover items
      if (item.showInBoth && (item.type === "anime" || item.type === "manga")) {
        const altType = item.type === "anime" ? "manga" : "anime";
        if (!acc[altType]) acc[altType] = [];
        // Create a copy with _displayAsAlt flag for alternate image ordering
        acc[altType].push({ ...item, _displayAsAlt: true });
      }
      return acc;
    },
    {} as Record<
      string,
      (typeof media extends (infer T)[] | undefined
        ? T & { _displayAsAlt?: boolean }
        : never)[]
    >,
  );

  // Sort items within each group by order (use altOrder for crossover items in their alt section)
  if (grouped) {
    for (const type of Object.keys(grouped)) {
      grouped[type]?.sort((a, b) => {
        const orderA = a._displayAsAlt
          ? (a.altOrder ?? a.order ?? 0)
          : (a.order ?? 0);
        const orderB = b._displayAsAlt
          ? (b.altOrder ?? b.order ?? 0)
          : (b.order ?? 0);
        return orderA - orderB;
      });
    }
  }

  const sortedTypes = typeOrder.filter((t) => grouped?.[t]?.length);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="space-y-8 animate-fade-in">
        <PageHeader
          path="/media"
          title="media"
          subtitle="things i've consumed and enjoyed"
          count={media?.length}
        />

        {/* Filter tabs */}
        <FilterPills
          options={[
            { value: null, label: "all" },
            ...sortedTypes.map((type) => ({
              value: type,
              label: typeLabels[type],
            })),
          ]}
          value={filter}
          onChange={(value) => {
            setFilter(value);
            track("filter_use", { page: "media", filter: value ?? "all" });
          }}
        />

        {media.length === 0 ? (
          <EmptyState message="no media added yet" />
        ) : (
          <div className="space-y-10">
            {sortedTypes
              .filter((type) => !filter || filter === type)
              .map((type) => {
                const items = grouped?.[type] || [];
                const showAll = filter === type;
                const displayItems = showAll ? items : items.slice(0, 4);
                const hasMore = !showAll && items.length > 4;

                return (
                  <section key={type}>
                    <SectionHeading
                      title={typeLabels[type]}
                      count={items.length}
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {displayItems.map((item) => (
                        <MediaCard
                          key={item._id}
                          item={item}
                          isExpanded={expanded === item._id}
                          onExpand={(event) => {
                            trigger.current = event.currentTarget;
                            const isOpening = expanded !== item._id;
                            setExpanded(isOpening ? item._id : null);
                            if (isOpening) {
                              track("media_expand", {
                                title: item.title,
                                type: item.type,
                              });
                            }
                          }}
                        />
                      ))}
                    </div>
                    {hasMore && (
                      <button
                        type="button"
                        onClick={() => setFilter(type)}
                        className="mt-4 text-sm text-muted-foreground hover:text-rose transition-colors"
                      >
                        see all {items.length} {typeLabels[type]} &rarr;
                      </button>
                    )}
                  </section>
                );
              })}
          </div>
        )}
      </div>

      {/* Expanded modal */}
      {expanded && (
        <MediaModal
          item={media?.find((m) => m._id === expanded) || null}
          onClose={() => setExpanded(null)}
          restoreFocus={() => trigger.current?.focus()}
        />
      )}
    </div>
  );
}

function MediaCard({
  item,
  onExpand,
}: {
  item: MediaItem;
  isExpanded: boolean;
  onExpand: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const images = getMediaImages(item);

  return (
    <button
      type="button"
      onClick={onExpand}
      className="group relative tcard tcard-hover overflow-hidden text-left w-full"
    >
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-surface">
        {images.length > 0 ? (
          <Image
            src={images[0]}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            unoptimized={isGif(images[0])}
          />
        ) : (
          <div className="w-full h-full bg-background flex items-center justify-center text-muted-foreground text-xs">
            no image
          </div>
        )}
      </div>
      {/* Always visible title at bottom */}
      <div className="p-2 border-t border-border/50 flex items-center justify-between gap-1">
        <h3 className="text-sm font-medium flex-1 min-w-0">{item.title}</h3>
        {/* Mobile tap indicator - shows notes icon if there's content */}
        {item.content ? (
          <svg
            aria-hidden="true"
            className="md:hidden w-4 h-4 text-rose/70 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        ) : (
          <span className="md:hidden text-[10px] text-rose/60 shrink-0">↗</span>
        )}
      </div>
      {/* Hover overlay - desktop only */}
      <div className="hidden md:flex absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center flex-col gap-1">
        {item.content ? (
          <>
            <svg
              aria-hidden="true"
              className="w-4 h-4 text-rose"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-[10px] text-rose/80">notes</span>
          </>
        ) : (
          <span className="text-xs text-rose">view</span>
        )}
      </div>
    </button>
  );
}

function MediaModal({
  item,
  onClose,
  restoreFocus,
}: {
  item: MediaItem | null;
  onClose: () => void;
  restoreFocus: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = item ? getMediaImages(item) : [];

  const goNext = () => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }
  };

  const goPrev = () => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (images.length < 2) return;
      if (e.key === "ArrowLeft")
        setCurrentIndex((index) => (index - 1 + images.length) % images.length);
      if (e.key === "ArrowRight")
        setCurrentIndex((index) => (index + 1) % images.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length]);

  if (!item) return null;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreFocus();
        }}
        className="max-w-lg max-h-[90vh] overflow-auto p-6 bg-background"
        aria-describedby={undefined}
      >
        {/* Image gallery */}
        {images.length > 0 && (
          <div className="relative">
            <div className="relative overflow-hidden rounded-t-lg bg-background/50 h-[400px]">
              {images.map((url, index) => (
                <div
                  key={url}
                  className="absolute inset-0 transition-opacity duration-300 ease-in-out"
                  style={{
                    opacity: index === currentIndex ? 1 : 0,
                  }}
                >
                  <Image
                    src={url}
                    alt={`${item.title} ${index + 1}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 512px"
                    unoptimized={isGif(url)}
                    placeholder={isGif(url) ? "empty" : "blur"}
                    blurDataURL={BLUR_DATA_URL}
                  />
                </div>
              ))}
            </div>

            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 hover:bg-background rounded-full flex items-center justify-center text-foreground transition-colors z-10"
                >
                  &lt;
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 hover:bg-background rounded-full flex items-center justify-center text-foreground transition-colors z-10"
                >
                  &gt;
                </button>
              </>
            )}

            {/* Dots indicator */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    aria-label={`Go to image ${index + 1}`}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex
                        ? "bg-rose"
                        : "bg-white/40 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute top-3 left-3 px-2 py-1 bg-background/80 rounded text-xs">
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>
        )}

        <div className="p-4 space-y-3">
          <DialogTitle className="text-2xl font-normal">
            {item.title}
          </DialogTitle>

          <p className="text-xs text-muted-foreground uppercase">
            {typeLabels[item.type] || item.type}
          </p>

          {item.content && (
            <div className="text-sm">
              <Markdown content={item.content} />
            </div>
          )}

          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-background rounded border border-border"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {item.links && item.links.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {item.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-rose-deep hover:text-rose"
                >
                  {link.label} &rarr;
                </a>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
