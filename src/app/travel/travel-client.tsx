"use client";

import { type Preloaded, usePreloadedQuery } from "convex/react";
import mapboxgl from "mapbox-gl";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/markdown";
import { PageHeader } from "@/components/page-header";
import type { api } from "../../../convex/_generated/api";
import "mapbox-gl/dist/mapbox-gl.css";

export function TravelClient({
  preloadedLocations,
}: {
  preloadedLocations: Preloaded<typeof api.travel.list>;
}) {
  const data = usePreloadedQuery(preloadedLocations);
  const locations = [...data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const [selected, setSelected] = useState<string | null>(null);
  const notes = useRef<HTMLElement>(null);
  const selectPlace = useCallback((id: string) => {
    if (window.location.hash !== `#${id}`)
      window.history.pushState(null, "", `#${id}`);
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
    const restore = () => setSelected(window.location.hash.slice(1) || null);
    restore();
    window.addEventListener("hashchange", restore);
    window.addEventListener("popstate", restore);
    return () => {
      window.removeEventListener("hashchange", restore);
      window.removeEventListener("popstate", restore);
    };
  }, []);
  const active =
    locations.find((place) => place._id === selected) ?? locations[0];
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!container.current || !token) return;
    let instance: mapboxgl.Map;
    try {
      instance = new mapboxgl.Map({
        container: container.current,
        accessToken: token,
        style: "mapbox://styles/mapbox/light-v11",
        center: [10, 25],
        zoom: 1.3,
        attributionControl: true,
      });
    } catch {
      setFailed(true);
      return;
    }
    map.current = instance;
    instance.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right",
    );
    instance.on("load", () => setReady(true));
    return () => {
      instance.remove();
      map.current = null;
    };
  }, [token]);

  useEffect(() => {
    if (!ready || !map.current) return;
    const markers = data.map((place) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", place.location);
      Object.assign(button.style, {
        width: "12px",
        height: "12px",
        borderRadius: "50%",
        background: "#986a54",
        border: "2px solid white",
        cursor: "pointer",
      });
      button.addEventListener("click", () => selectPlace(place._id));
      const marker = new mapboxgl.Marker({ element: button })
        .setLngLat([place.coordinates.lng, place.coordinates.lat])
        .addTo(map.current as mapboxgl.Map);
      button.setAttribute("role", "button");
      return marker;
    });
    return () => {
      for (const marker of markers) marker.remove();
    };
  }, [data, ready, selectPlace]);

  useEffect(() => {
    if (!selected || !active || !ready) return;
    map.current?.easeTo({
      center: [active.coordinates.lng, active.coordinates.lat],
      zoom: 5,
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 700,
    });
  }, [selected, active, ready]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <PageHeader path="/travel" title="travel" subtitle="" />
      {token && !failed && (
        <section
          className="travel-map"
          ref={container}
          aria-label="Map of places visited"
        />
      )}
      <div className="travel-index">
        <nav aria-label="Places">
          {locations.map((place) => (
            <a
              href={`#${place._id}`}
              key={place._id}
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
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  <Image
                    src={url}
                    alt={`${active.location}, photograph ${index + 1}`}
                    width={600}
                    height={450}
                    unoptimized
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
