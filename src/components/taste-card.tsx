"use client";

import Image from "next/image";
import { useState } from "react";
import { isGif } from "@/lib/media";
import { Markdown } from "./markdown";

interface TasteItem {
  _id: string;
  title: string;
  url: string;
  content?: string;
  designNotes?: string;
  screenshotUrls?: string[];
  tags?: string[];
}

export function TasteCard({ item }: { item: TasteItem; delay?: number }) {
  const [selected, setSelected] = useState(0);
  const images = item.screenshotUrls ?? [];
  const active = images[selected] ?? images[0];
  let domain = item.url;
  try {
    domain = new URL(item.url).hostname.replace(/^www\./, "");
  } catch {}
  return (
    <article className="taste-entry">
      {active && (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="relative block aspect-video overflow-hidden bg-surface"
        >
          <Image
            src={active}
            alt={`${item.title} screenshot`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            unoptimized={isGif(active)}
          />
        </a>
      )}
      {images.length > 1 && (
        <div className="flex gap-2 mt-3">
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`${item.title}, image ${index + 1}`}
              aria-pressed={selected === index}
              className={`relative w-12 h-9 border ${selected === index ? "border-rose-deep" : "border-transparent"}`}
            >
              <Image
                src={url}
                alt=""
                fill
                className="object-cover"
                sizes="48px"
                unoptimized={isGif(url)}
              />
            </button>
          ))}
        </div>
      )}
      <h3 className="text-2xl mt-5">
        <a href={item.url} target="_blank" rel="noreferrer">
          {item.title}
        </a>
      </h3>
      <p className="text-xs text-muted-foreground mt-1">{domain}</p>
      {item.content && (
        <div className="mt-3 text-base">
          <Markdown content={item.content} />
        </div>
      )}
      {item.designNotes && (
        <details className="mt-4 text-base">
          <summary className="cursor-pointer text-rose-deep">
            design notes
          </summary>
          <div className="mt-3">
            <Markdown content={item.designNotes} />
          </div>
        </details>
      )}
    </article>
  );
}
