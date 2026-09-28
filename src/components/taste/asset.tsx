"use client";

import { useEffect, useRef, useState } from "react";
import {
  assetRatio,
  embedSource,
  type TasteMedia,
} from "../../../shared/taste";
import { SoftImage } from "../soft-image";
import { imageUnoptimized, TasteProse, TextArtwork } from "./text";

function Recording({ asset }: { asset: TasteMedia }) {
  const element = useRef<HTMLMediaElement | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const media = element.current;
    return () => media?.pause();
  }, []);
  const common = {
    src: asset.url,
    controls: true,
    preload: "none" as const,
    className: "taste-player",
    onError: () => setFailed(true),
    onLoadedMetadata: () => {
      const node = element.current;
      if (node && asset.startSeconds)
        node.currentTime = Math.min(
          asset.startSeconds,
          Number.isFinite(node.duration)
            ? Math.max(0, node.duration - 0.1)
            : asset.startSeconds,
        );
    },
    onPlay: () => {
      for (const media of document.querySelectorAll<HTMLMediaElement>(
        ".taste-player",
      )) {
        if (media !== element.current) media.pause();
      }
    },
  };
  return (
    <>
      {asset.kind === "video" ? (
        <video
          {...common}
          ref={(node) => {
            element.current = node;
          }}
          playsInline
          poster={asset.poster}
          style={{ aspectRatio: assetRatio(asset) }}
          aria-label={asset.alt || "Video recording"}
        >
          {asset.captionsUrl && (
            <track
              kind="captions"
              src={asset.captionsUrl}
              srcLang={asset.captionsLanguage || "en"}
              label="captions"
            />
          )}
        </video>
      ) : (
        <div className="taste-audio">
          {asset.poster && (
            <div className="taste-audio-poster">
              <SoftImage
                src={asset.poster}
                alt={asset.alt || ""}
                fill
                className="object-contain"
                unoptimized={imageUnoptimized(asset.poster)}
              />
            </div>
          )}
          <audio
            {...common}
            ref={(node) => {
              element.current = node;
            }}
            aria-label={asset.alt || "Audio recording"}
          />
        </div>
      )}
      {(asset.startSeconds || asset.endSeconds) && (
        <p className="taste-timestamp">
          {asset.startSeconds ?? 0}s
          {asset.endSeconds !== undefined ? ` – ${asset.endSeconds}s` : ""}
        </p>
      )}
      {failed && (
        <p className="taste-timestamp">
          couldn’t play this recording.{" "}
          <a href={asset.url} target="_blank" rel="noreferrer">
            open the file ↗
          </a>
        </p>
      )}
      {asset.transcript && (
        <details className="taste-transcript">
          <summary>transcript</summary>
          <TasteProse text={asset.transcript} />
        </details>
      )}
    </>
  );
}

function Interactive({ asset }: { asset: TasteMedia }) {
  const [open, setOpen] = useState(false);
  const source = embedSource(asset.url ?? "https://example.com");
  return (
    <div className="taste-interactive">
      <div
        className="taste-interactive-frame"
        style={{ aspectRatio: assetRatio(asset) }}
      >
        {open ? (
          <iframe
            src={source.url}
            title={asset.alt || "Interactive example"}
            sandbox={`allow-scripts allow-pointer-lock allow-presentation${source.trusted ? " allow-same-origin" : ""}`}
            allow="fullscreen"
            referrerPolicy="no-referrer"
          />
        ) : (
          <>
            {asset.poster && (
              <SoftImage
                src={asset.poster}
                alt={asset.alt || "Interactive example preview"}
                fill
                className="object-contain"
                unoptimized={imageUnoptimized(asset.poster)}
              />
            )}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="taste-activate"
            >
              load interactive example
            </button>
          </>
        )}
      </div>
      <div className="editorial-links">
        {open && (
          <button
            type="button"
            className="text-action"
            onClick={() => setOpen(false)}
          >
            close example
          </button>
        )}
        <a href={asset.url} target="_blank" rel="noreferrer">
          open original ↗
        </a>
      </div>
    </div>
  );
}

function AnimatedImage({ asset }: { asset: TasteMedia }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div>
      <div
        className="taste-animated-image"
        style={{ aspectRatio: assetRatio(asset) }}
      >
        {(playing ? asset.url : asset.poster) ? (
          <SoftImage
            src={(playing ? asset.url : asset.poster) ?? ""}
            alt={asset.alt || "Animation"}
            fill
            className="object-contain"
            unoptimized
          />
        ) : (
          <span>{asset.alt || "Animation"}</span>
        )}
      </div>
      <button
        type="button"
        className="text-action"
        onClick={() => setPlaying(!playing)}
      >
        {playing ? "stop animation" : "play animation"}
      </button>
    </div>
  );
}

export function TasteAsset({
  asset,
  onImage,
}: {
  asset: TasteMedia;
  onImage?: (element: HTMLButtonElement) => void;
}) {
  return (
    <figure className={`taste-asset taste-asset-${asset.kind}`}>
      {asset.kind === "text" ? (
        <TextArtwork asset={asset} />
      ) : asset.kind === "embed" ? (
        <Interactive asset={asset} />
      ) : asset.kind === "video" || asset.kind === "audio" ? (
        <Recording asset={asset} />
      ) : asset.animated ? (
        <AnimatedImage asset={asset} />
      ) : (
        <button
          type="button"
          className="taste-image-button"
          onClick={(event) => onImage?.(event.currentTarget)}
          aria-label={`Enlarge ${asset.alt || "image"}`}
        >
          <SoftImage
            src={asset.url ?? ""}
            alt={asset.alt || ""}
            width={asset.width || 1200}
            height={asset.height || 800}
            className="h-auto w-full"
            sizes="(max-width:700px) 90vw, 1000px"
            unoptimized={imageUnoptimized(asset.url ?? "")}
          />
          <span className="gallery-expand" aria-hidden="true">
            ↗
          </span>
        </button>
      )}
      {(asset.caption || asset.credit) && (
        <figcaption>
          {asset.caption && <p>{asset.caption}</p>}
          {asset.credit &&
            (asset.creditUrl ? (
              <a href={asset.creditUrl} target="_blank" rel="noreferrer">
                {asset.credit} ↗
              </a>
            ) : (
              <span>{asset.credit}</span>
            ))}
        </figcaption>
      )}
    </figure>
  );
}
