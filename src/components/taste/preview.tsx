"use client";

import { useEffect, useRef, useState } from "react";
import { REDUCED_MOTION } from "@/lib/motion";
import { assetRatio, type TasteMedia } from "../../../shared/taste";
import { IntentLink } from "../intent-link";
import { SoftImage } from "../soft-image";
import { imageUnoptimized, TextArtwork } from "./text";

export function TastePreview({
  asset,
  title,
  href,
  previewKey,
}: {
  asset: TasteMedia | undefined;
  title: string;
  href: string;
  previewKey: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const previewable =
    !!asset &&
    (asset.kind === "video" || (asset.kind === "image" && asset.animated));
  function start(manual = false) {
    if (!previewable || (!manual && window.matchMedia(REDUCED_MOTION).matches))
      return;
    window.dispatchEvent(
      new CustomEvent("taste:preview", { detail: previewKey }),
    );
    setPlaying(true);
  }
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const preference = window.matchMedia(REDUCED_MOTION);
    const stop = () => {
      if (document.hidden || preference.matches) setPlaying(false);
    };
    const other = (event: Event) => {
      if ((event as CustomEvent).detail !== previewKey) setPlaying(false);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) setPlaying(false);
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", stop);
    preference.addEventListener("change", stop);
    window.addEventListener("taste:preview", other);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", stop);
      preference.removeEventListener("change", stop);
      window.removeEventListener("taste:preview", other);
    };
  }, [previewKey]);
  useEffect(() => {
    const element = video.current;
    if (!playing || !element || asset?.kind !== "video" || !asset.url) return;
    let active = true;
    const startTime = () =>
      Math.min(
        asset?.startSeconds ?? 0,
        Number.isFinite(element.duration)
          ? Math.max(0, element.duration - 0.1)
          : Infinity,
      );
    const play = () => {
      if (asset?.startSeconds) element.currentTime = startTime();
      void element.play().catch(() => {
        if (active) setPlaying(false);
      });
    };
    const loop = () => {
      const start = startTime();
      const end = Math.min(
        asset?.endSeconds ?? start + 6,
        start + 10,
        Number.isFinite(element.duration) ? element.duration : Infinity,
      );
      if (element.currentTime >= end || element.currentTime < start - 0.1)
        element.currentTime = start;
    };
    element.addEventListener("loadedmetadata", play);
    element.addEventListener("timeupdate", loop);
    if (element.readyState >= 1) play();
    return () => {
      active = false;
      element.pause();
      element.removeEventListener("loadedmetadata", play);
      element.removeEventListener("timeupdate", loop);
      element.removeAttribute("src");
      element.load();
    };
  }, [
    playing,
    asset?.startSeconds,
    asset?.endSeconds,
    asset?.url,
    asset?.kind,
  ]);
  const still =
    asset?.kind === "image" && !asset.animated ? asset.url : asset?.poster;
  return (
    <div
      ref={root}
      className={`taste-cover ${asset?.kind === "text" ? "taste-cover-text" : ""}`}
      style={{ aspectRatio: assetRatio(asset) }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setPlaying(false);
      }}
      onFocusCapture={(event) => {
        if (event.target instanceof HTMLAnchorElement) start();
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setPlaying(false);
      }}
    >
      <IntentLink
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") start();
        }}
        href={href}
        className="taste-cover-link"
        aria-label={`Explore ${title}`}
      >
        {asset?.kind === "text" ? (
          <TextArtwork asset={asset} preview />
        ) : playing && asset?.kind === "video" ? (
          <video
            key={asset.url}
            ref={video}
            src={asset.url}
            muted
            playsInline
            loop
            preload="metadata"
            aria-hidden="true"
            tabIndex={-1}
          />
        ) : playing && asset?.animated ? (
          <SoftImage
            src={asset.url ?? ""}
            alt=""
            fill
            unoptimized
            className="object-contain"
          />
        ) : still ? (
          <SoftImage
            src={still}
            alt={asset?.alt || title}
            fill
            sizes="(max-width:600px) 90vw, (max-width:900px) 45vw, 600px"
            className="object-contain"
            unoptimized={imageUnoptimized(still)}
          />
        ) : (
          <span className="taste-cover-word">{title}</span>
        )}
      </IntentLink>
      {previewable && (
        <button
          type="button"
          className="taste-preview-toggle"
          aria-label={`${playing ? "Pause" : "Play"} preview of ${title}`}
          aria-pressed={playing}
          onClick={() => (playing ? setPlaying(false) : start(true))}
        >
          {playing ? "pause" : "play preview"}
        </button>
      )}
      {!previewable &&
        asset &&
        (asset.kind === "audio" || asset.kind === "embed") && (
          <span className="taste-format" aria-hidden="true">
            {asset.kind === "audio" ? "listen" : "interactive"}
          </span>
        )}
    </div>
  );
}
