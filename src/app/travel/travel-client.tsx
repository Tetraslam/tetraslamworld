"use client";

import { type Preloaded, usePreloadedQuery } from "convex/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/markdown";
import { PageHeader } from "@/components/page-header";
import type { api } from "../../../convex/_generated/api";

const TravelMap = dynamic(() => import("./travel-map"), {
  ssr: false,
  loading: () => (
    <div className="travel-map map-placeholder">
      <output>loading map…</output>
    </div>
  ),
});

export function TravelClient({
  preloadedLocations,
  initialPlace,
}: {
  preloadedLocations: Preloaded<typeof api.travel.list>;
  initialPlace: string | null;
}) {
  const data = usePreloadedQuery(preloadedLocations);
  const locations = [...data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const [selected, setSelected] = useState(initialPlace);
  const [showMap, setShowMap] = useState(false);
  const notes = useRef<HTMLElement>(null);
  const active =
    locations.find((place) => place._id === selected) ?? locations[0];
  const selectPlace = useCallback((id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("place", id);
    url.hash = "";
    if (url.href !== window.location.href)
      window.history.pushState(null, "", url);
    setSelected(id);
    if (window.matchMedia("(max-width: 600px)").matches)
      requestAnimationFrame(() => {
        notes.current?.focus({ preventScroll: true });
        notes.current?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
          block: "start",
        });
      });
  }, []);
  useEffect(() => {
    // Preserve old shared fragment links; new links are readable on the server.
    const restore = () =>
      setSelected(
        new URL(window.location.href).searchParams.get("place") ||
          window.location.hash.slice(1) ||
          null,
      );
    restore();
    window.addEventListener("popstate", restore);
    window.addEventListener("hashchange", restore);
    return () => {
      window.removeEventListener("popstate", restore);
      window.removeEventListener("hashchange", restore);
    };
  }, []);
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <PageHeader
        path="/travel"
        title="travel"
        subtitle=""
        action={
          process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
            <button
              type="button"
              aria-expanded={showMap}
              aria-controls="travel-map"
              onClick={() => setShowMap(!showMap)}
            >
              {showMap ? "hide map" : "show map"}
            </button>
          ) : undefined
        }
      />
      {showMap && (
        <div id="travel-map">
          <TravelMap
            locations={locations}
            active={active}
            onSelect={selectPlace}
          />
        </div>
      )}
      <div className="travel-index">
        <nav aria-label="Places">
          {locations.map((place) => (
            <a
              key={place._id}
              href={`?place=${place._id}`}
              aria-current={active?._id === place._id ? "location" : undefined}
              onClick={(event) => {
                if (
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                event.preventDefault();
                selectPlace(place._id);
              }}
            >
              {place.location}
            </a>
          ))}
        </nav>
        {active ? (
          <article
            className="travel-place"
            ref={notes}
            tabIndex={-1}
            aria-label={active.location}
          >
            <h2>{active.location}</h2>
            {active.dates?.start && (
              <p className="text-sm text-muted-foreground mb-5">
                {active.dates.start}
                {active.dates.end ? ` — ${active.dates.end}` : ""}
              </p>
            )}
            {active.content && <Markdown content={active.content} />}
            <div className="travel-photos">
              {active.photoUrls?.map((url, index) => (
                <a
                  key={url}
                  className="travel-photo"
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Image
                    src={url}
                    alt={`${active.location}, photograph ${index + 1}`}
                    fill
                    sizes="(max-width:600px) 45vw, 350px"
                    className="object-cover"
                  />
                </a>
              ))}
            </div>
          </article>
        ) : (
          <p>no places added yet.</p>
        )}
      </div>
    </div>
  );
}
