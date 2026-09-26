"use client";

import mapboxgl from "mapbox-gl";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

type Place = {
  _id: string;
  location: string;
  coordinates: { lat: number; lng: number };
};
export default function TravelMap({
  locations,
  active,
  onSelect,
}: {
  locations: Place[];
  active: Place | undefined;
  onSelect: (id: string) => void;
}) {
  const { resolvedTheme } = useTheme();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const currentStyle = useRef("");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: Retrying must recreate the failed renderer.
  useEffect(() => {
    if (!container.current) return;
    setFailed(false);
    setReady(false);
    let instance: mapboxgl.Map;
    currentStyle.current = document.documentElement.classList.contains("dark")
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/light-v11";
    try {
      instance = new mapboxgl.Map({
        container: container.current,
        accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
        style: currentStyle.current,
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
    instance.on("load", () => {
      setFailed(false);
      setReady(true);
    });
    instance.on("style.load", () => {
      setFailed(false);
      if (currentStyle.current.includes("dark-v11")) {
        const colors = getComputedStyle(document.documentElement);
        for (const layer of instance.getStyle()?.layers ?? []) {
          if (layer.type === "symbol" && layer.layout?.["text-field"]) {
            instance.setPaintProperty(
              layer.id,
              "text-color",
              colors.getPropertyValue("--muted-foreground").trim(),
            );
            instance.setPaintProperty(
              layer.id,
              "text-halo-color",
              colors.getPropertyValue("--background").trim(),
            );
          }
        }
      }
    });
    instance.on("error", () => {
      if (!instance.isStyleLoaded()) setFailed(true);
    });
    return () => {
      instance.remove();
      map.current = null;
    };
  }, [attempt]);
  useEffect(() => {
    if (!map.current || !resolvedTheme) return;
    const style =
      resolvedTheme === "dark"
        ? "mapbox://styles/mapbox/dark-v11"
        : "mapbox://styles/mapbox/light-v11";
    if (currentStyle.current === style) return;
    currentStyle.current = style;
    map.current.setStyle(style);
  }, [resolvedTheme]);
  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance) return;
    const markers = locations.map((place) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", place.location);
      button.className = "map-marker";
      button.addEventListener("click", () => onSelect(place._id));
      const marker = new mapboxgl.Marker({ element: button })
        .setLngLat([place.coordinates.lng, place.coordinates.lat])
        .addTo(instance);
      button.setAttribute("role", "button");
      return marker;
    });
    return () => {
      for (const marker of markers) marker.remove();
    };
  }, [locations, ready, onSelect]);
  useEffect(() => {
    if (!ready || !active) return;
    map.current?.easeTo({
      center: [active.coordinates.lng, active.coordinates.lat],
      zoom: 4,
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 600,
    });
  }, [ready, active]);
  return (
    <section className="travel-map" aria-label="Map of places visited">
      <div ref={container} className="map-canvas" />
      {failed && (
        <div className="map-placeholder map-failure">
          <p>couldn’t load the map.</p>
          <button
            type="button"
            className="text-action"
            onClick={() => setAttempt(attempt + 1)}
          >
            try again
          </button>
        </div>
      )}
    </section>
  );
}
