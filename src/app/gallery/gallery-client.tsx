"use client";

import { track } from "@vercel/analytics";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { ImageSwap } from "@/components/image-swap";
import { PageHeader } from "@/components/page-header";
import { SoftImage as Image } from "@/components/soft-image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { BLUR_DATA_URL, isGif } from "@/lib/media";
import { entranceStyle } from "@/lib/motion";
import type { api } from "../../../convex/_generated/api";

export function GalleryClient({
  preloadedImages,
}: {
  preloadedImages: Preloaded<typeof api.gallery.list>;
}) {
  const images = usePreloadedQuery(preloadedImages);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement | null>(null);

  const sortedImages = useMemo(
    () => [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [images],
  );
  const activeIndex = sortedImages.findIndex(
    (image) => image.imageUrl === lightbox,
  );
  const move = useCallback(
    (direction: number) => {
      if (activeIndex < 0 || !sortedImages.length) return;
      setLightbox(
        sortedImages[
          (activeIndex + direction + sortedImages.length) % sortedImages.length
        ].imageUrl,
      );
    },
    [activeIndex, sortedImages],
  );
  useEffect(() => {
    if (!lightbox || !viewerOpen) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        move(event.key === "ArrowLeft" ? -1 : 1);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [lightbox, move, viewerOpen]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="space-y-8 animate-fade-in">
        <PageHeader
          path="/gallery"
          title="gallery"
          subtitle="random snapshots and visual ephemera"
          count={images?.length}
          countLabel="photos"
        />

        {sortedImages.length === 0 ? (
          <EmptyState message="no images yet" />
        ) : (
          <div className="gallery-grid">
            {sortedImages.map((image, index) => (
              <button
                key={image._id}
                type="button"
                aria-label={`Open photograph: ${image.caption || `photo ${index + 1}`}`}
                onClick={(event) => {
                  trigger.current = event.currentTarget;
                  setLightbox(image.imageUrl);
                  setViewerOpen(true);
                  track("gallery_image_view", {
                    caption: image.caption || "untitled",
                  });
                }}
                className="gallery-card mb-7 relative block w-full text-left enter-item"
                style={entranceStyle(index)}
              >
                <span className="gallery-thumb">
                  <Image
                    src={image.imageUrl}
                    alt={image.caption || "Gallery image"}
                    fill
                    loading={index < 3 ? "eager" : "lazy"}
                    className="object-cover"
                    sizes="(max-width: 600px) calc(100vw - 48px), (max-width: 900px) 45vw, 360px"
                    unoptimized={isGif(image.imageUrl)}
                    placeholder={isGif(image.imageUrl) ? "empty" : "blur"}
                    blurDataURL={BLUR_DATA_URL}
                  />
                  <span className="gallery-expand" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />
                    </svg>
                  </span>
                </span>
                {image.caption && (
                  <div className="gallery-caption pt-2">
                    <p className="text-sm text-foreground">{image.caption}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <Dialog
          open={viewerOpen}
          onOpenChange={(open) => {
            if (!open) setViewerOpen(false);
          }}
        >
          <DialogContent
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              trigger.current?.focus();
            }}
            className="sm:max-w-[94vw] h-[94svh] bg-background p-6 grid-rows-[minmax(0,1fr)_auto]"
            aria-describedby={undefined}
          >
            <DialogTitle className="sr-only">
              {images.find((image) => image.imageUrl === lightbox)?.caption ||
                "Photograph"}
            </DialogTitle>
            <div className="relative w-full h-full">
              <ImageSwap
                src={lightbox}
                alt={sortedImages[activeIndex]?.caption || "Photograph"}
                fill
                className="object-contain"
                sizes="90vw"
                unoptimized={isGif(lightbox)}
                priority
              />
            </div>
            <div className="viewer-controls">
              {sortedImages.length > 1 && (
                <button
                  type="button"
                  aria-label="Previous photograph"
                  onClick={() => move(-1)}
                >
                  ←
                </button>
              )}
              <span>{sortedImages[activeIndex]?.caption}</span>
              {sortedImages.length > 1 && (
                <>
                  <output aria-live="polite">
                    {activeIndex + 1} / {sortedImages.length}
                  </output>
                  <button
                    type="button"
                    aria-label="Next photograph"
                    onClick={() => move(1)}
                  >
                    →
                  </button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
