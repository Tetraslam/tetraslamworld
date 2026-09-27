"use client";

import { useEffect, useRef, useState } from "react";
import {
  categoryLabel,
  type TasteRecord,
  tasteCategories,
  tasteMedia,
} from "../../../shared/taste";
import { ImageSwap } from "../image-swap";
import { IntentLink } from "../intent-link";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { TasteAsset } from "./asset";
import { imageUnoptimized, TasteProse } from "./text";

export function TasteEntryView({ entry }: { entry: TasteRecord }) {
  const media = tasteMedia(entry);
  const images = media.filter(
    (asset) => asset.kind === "image" && !asset.animated,
  );
  const [imageId, setImageId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const index = images.findIndex((asset) => asset.id === imageId);
  const active = images[index];
  useEffect(() => {
    if (!open || index < 0) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        setImageId(
          images[
            (index + (event.key === "ArrowLeft" ? -1 : 1) + images.length) %
              images.length
          ].id,
        );
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, index, images]);
  const sources = [
    ...(entry.url ? [{ label: "source", url: entry.url }] : []),
    ...(entry.sources ?? []),
  ].filter(
    (source, index, all) =>
      all.findIndex((other) => other.url === source.url) === index,
  );
  return (
    <article className="taste-detail">
      <header className="taste-detail-heading">
        <h1>{entry.title}</h1>
        {entry.scope === "detail" && entry.context && (
          <p className="taste-context">a detail of {entry.context}</p>
        )}
        {(entry.creator || entry.year) && (
          <p className="taste-creator">
            {[entry.creator, entry.year].filter(Boolean).join(" · ")}
          </p>
        )}
        {entry.observation && <p className="taste-lede">{entry.observation}</p>}
        {sources.length > 0 && (
          <div className="editorial-links">
            {sources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noreferrer"
              >
                {source.label} ↗
              </a>
            ))}
          </div>
        )}
      </header>
      {media.length > 0 && (
        <div className="taste-supporting-media">
          {media.map((asset) => (
            <TasteAsset
              key={asset.id}
              asset={asset}
              onImage={(element) => {
                trigger.current = element;
                setImageId(asset.id);
                setOpen(true);
              }}
            />
          ))}
        </div>
      )}
      {entry.content && (
        <div className="taste-detail-copy">
          <TasteProse text={entry.content} />
        </div>
      )}
      {entry.designNotes && (
        <section className="taste-detail-copy">
          <h2>what i notice</h2>
          <TasteProse text={entry.designNotes} />
        </section>
      )}
      {(tasteCategories(entry).length > 0 || entry.qualities?.length) && (
        <footer className="taste-connections">
          {tasteCategories(entry).map((category) => (
            <IntentLink
              key={category}
              href={`/taste?category=${encodeURIComponent(category)}`}
            >
              {categoryLabel(category)}
            </IntentLink>
          ))}
          {entry.qualities?.map((quality) => (
            <IntentLink
              key={quality}
              href={`/taste?quality=${encodeURIComponent(quality)}`}
            >
              {quality}
            </IntentLink>
          ))}
        </footer>
      )}
      {active && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            className="sm:max-w-[94vw] h-[94svh] bg-background p-6 grid-rows-[minmax(0,1fr)_auto]"
            aria-describedby={undefined}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              trigger.current?.focus({ preventScroll: true });
            }}
          >
            <DialogTitle className="sr-only">
              {active.alt || entry.title}
            </DialogTitle>
            <div className="relative w-full h-full">
              <ImageSwap
                src={active.url ?? ""}
                alt={active.alt || entry.title}
                fill
                className="object-contain"
                sizes="90vw"
                unoptimized={imageUnoptimized(active.url ?? "")}
              />
            </div>
            <div className="viewer-controls">
              {images.length > 1 && (
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={() =>
                    setImageId(
                      images[(index - 1 + images.length) % images.length].id,
                    )
                  }
                >
                  ←
                </button>
              )}
              <span>{active.caption || active.alt}</span>
              <a href={active.url} target="_blank" rel="noreferrer">
                original ↗
              </a>
              {images.length > 1 && (
                <>
                  <output>
                    {index + 1} / {images.length}
                  </output>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={() =>
                      setImageId(images[(index + 1) % images.length].id)
                    }
                  >
                    →
                  </button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </article>
  );
}
