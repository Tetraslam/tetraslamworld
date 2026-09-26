"use client";

import { type Preloaded, usePreloadedQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { FilterPills } from "@/components/filter-pills";
import { ImageSwap } from "@/components/image-swap";
import { Markdown } from "@/components/markdown";
import { PageHeader } from "@/components/page-header";
import { SoftImage as Image } from "@/components/soft-image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useListMotion } from "@/hooks/use-list-motion";
import { isGif } from "@/lib/media";
import { entranceStyle } from "@/lib/motion";
import type { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";

const categories: Record<string, string> = {
  anime: "anime",
  manga: "manga",
  book: "books",
  game: "games",
  music: "music",
  movie: "movies",
  show: "shows",
  other: "other",
};
type Item = Doc<"media"> & { alternate?: boolean };
function imagesFor(item: Item) {
  const images = item.imageUrls?.length
    ? item.imageUrls
    : item.imageUrl
      ? [item.imageUrl]
      : [];
  const order = item.altImageOrder;
  return item.alternate &&
    order?.length === images.length &&
    new Set(order).size === images.length &&
    order.every(
      (index) => Number.isInteger(index) && index >= 0 && index < images.length,
    )
    ? order.map((index) => images[index])
    : images;
}

export function MediaClient({
  preloadedMedia,
}: {
  preloadedMedia: Preloaded<typeof api.media.list>;
}) {
  const media = usePreloadedQuery(preloadedMedia);
  const motionRoot = useListMotion();
  const [category, setCategory] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selection, setSelection] = useState<{
    id: string;
    category: string;
  } | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const groups = Object.keys(categories)
    .map((type) => ({
      type,
      items: media
        .flatMap((item) => {
          if (item.type === type) return [item as Item];
          if (
            item.showInBoth &&
            ((item.type === "anime" && type === "manga") ||
              (item.type === "manga" && type === "anime"))
          )
            return [{ ...item, alternate: true }];
          return [];
        })
        .sort(
          (a, b) =>
            (a.alternate ? (a.altOrder ?? a.order ?? 0) : (a.order ?? 0)) -
            (b.alternate ? (b.altOrder ?? b.order ?? 0) : (b.order ?? 0)),
        ),
    }))
    .filter((group) => group.items.length);
  const selected = selection
    ? groups
        .find((group) => group.type === selection.category)
        ?.items.find((item) => item._id === selection.id)
    : null;
  return (
    <div ref={motionRoot} className="max-w-5xl mx-auto px-4 py-12 motion-list">
      <PageHeader path="/media" title="media" subtitle="" />
      <FilterPills
        options={[
          { value: null, label: "all" },
          ...groups.map((group) => ({
            value: group.type,
            label: categories[group.type],
          })),
        ]}
        value={category}
        onChange={setCategory}
      />
      <div className="media-shelves">
        {groups
          .filter((group) => !category || group.type === category)
          .map((group) => (
            <section key={group.type}>
              <h2 className="section-title">{categories[group.type]}</h2>
              <div className="media-shelf">
                {group.items.map((item, index) => (
                  <button
                    type="button"
                    key={item._id}
                    className="media-cover enter-item"
                    data-motion-key={`${group.type}-${item._id}`}
                    style={entranceStyle(index)}
                    aria-label={`Read about ${item.title}`}
                    onClick={(event) => {
                      trigger.current = event.currentTarget;
                      setSelection({ id: item._id, category: group.type });
                      setViewerOpen(true);
                    }}
                  >
                    <span className="cover-image">
                      {imagesFor(item)[0] ? (
                        <Image
                          loading={
                            index < 4 &&
                            (category !== null || group.type === groups[0].type)
                              ? "eager"
                              : "lazy"
                          }
                          src={imagesFor(item)[0]}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width:600px) 45vw, 220px"
                          unoptimized={isGif(imagesFor(item)[0])}
                        />
                      ) : (
                        <span>{item.title}</span>
                      )}
                    </span>
                    <span className="cover-title">{item.title}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
      </div>
      {!groups.length && <p>no media added yet.</p>}
      {selected && (
        <MediaViewer
          key={`${selected._id}-${selection?.category}`}
          item={selected}
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
          restoreFocus={() => trigger.current?.focus()}
        />
      )}
    </div>
  );
}

function MediaViewer({
  item,
  open,
  onClose,
  restoreFocus,
}: {
  item: Item;
  open: boolean;
  onClose: () => void;
  restoreFocus: () => void;
}) {
  const images = imagesFor(item);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!open) return;
    function key(event: KeyboardEvent) {
      if (images.length < 2 || event.altKey || event.ctrlKey || event.metaKey)
        return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        setIndex(
          (current) =>
            (current + (event.key === "ArrowLeft" ? -1 : 1) + images.length) %
            images.length,
        );
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [images.length, open]);
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="media-viewer"
        aria-describedby={undefined}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreFocus();
        }}
      >
        <DialogTitle>{item.title}</DialogTitle>
        {images.length > 0 && (
          <div className="viewer-picture">
            <ImageSwap
              src={images[index]}
              alt={`${item.title}, image ${index + 1}`}
              fill
              sizes="(max-width:600px) 90vw, 600px"
              className="object-contain"
              unoptimized={isGif(images[index])}
            />
          </div>
        )}
        {images.length > 1 && (
          <div className="viewer-controls">
            <button
              type="button"
              onClick={() =>
                setIndex((index - 1 + images.length) % images.length)
              }
              aria-label="Previous image"
            >
              ←
            </button>
            <output aria-live="polite">
              {index + 1} / {images.length}
            </output>
            <button
              type="button"
              onClick={() => setIndex((index + 1) % images.length)}
              aria-label="Next image"
            >
              →
            </button>
          </div>
        )}
        {item.content && <Markdown content={item.content} />}
        <div className="editorial-links">
          {item.links?.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
              {link.label} ↗
            </a>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
