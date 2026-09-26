"use client";

import { track } from "@vercel/analytics";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import Image from "next/image";
import { useRef, useState } from "react";
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

  const sortedImages = [...images].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

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
            className="sm:max-w-[94vw] h-[94vh] bg-background p-4"
            aria-describedby={undefined}
          >
            <DialogTitle className="sr-only">
              {images.find((image) => image.imageUrl === lightbox)?.caption ||
                "Photograph"}
            </DialogTitle>
            <div className="relative w-full h-full">
              <Image
                src={lightbox}
                alt="Full size"
                fill
                className="object-contain"
                sizes="90vw"
                unoptimized={isGif(lightbox)}
                priority
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
