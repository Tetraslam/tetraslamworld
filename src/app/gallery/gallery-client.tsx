"use client";

import { track } from "@vercel/analytics";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Masonry from "react-masonry-css";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { BLUR_DATA_URL, isGif } from "@/lib/media";
import type { api } from "../../../convex/_generated/api";

export function GalleryClient({
  preloadedImages,
}: {
  preloadedImages: Preloaded<typeof api.gallery.list>;
}) {
  const images = usePreloadedQuery(preloadedImages);
  const [lightbox, setLightbox] = useState<string | null>(null);
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
    if (!lightbox) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        move(event.key === "ArrowLeft" ? -1 : 1);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [lightbox, move]);

  const breakpointColumns = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1,
  };

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
          <Masonry
            breakpointCols={breakpointColumns}
            className="flex -ml-4 w-auto"
            columnClassName="pl-4 bg-clip-padding"
          >
            {sortedImages.map((image) => (
              <button
                key={image._id}
                type="button"
                onClick={(event) => {
                  trigger.current = event.currentTarget;
                  setLightbox(image.imageUrl);
                  track("gallery_image_view", {
                    caption: image.caption || "untitled",
                  });
                }}
                className="mb-7 group relative cursor-pointer block w-full text-left"
              >
                <Image
                  src={image.imageUrl}
                  alt={image.caption || "Gallery image"}
                  width={400}
                  height={300}
                  className="w-full h-auto object-cover"
                  sizes="(max-width: 500px) 100vw, (max-width: 700px) 50vw, (max-width: 1100px) 33vw, 25vw"
                  unoptimized={isGif(image.imageUrl)}
                  placeholder={isGif(image.imageUrl) ? "empty" : "blur"}
                  blurDataURL={BLUR_DATA_URL}
                />
                {image.caption && (
                  <div className="pt-2">
                    <p className="text-sm text-foreground">{image.caption}</p>
                  </div>
                )}
              </button>
            ))}
          </Masonry>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setLightbox(null);
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
              <Image
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
