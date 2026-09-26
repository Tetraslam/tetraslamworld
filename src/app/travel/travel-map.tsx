"use client";

import mapboxgl from "mapbox-gl";
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
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: Retrying must recreate the failed renderer.
  useEffect(() => {
    if (!container.current) return;
    setFailed(false);
    setReady(false);
    let instance: mapboxgl.Map;
    try {
      instance = new mapboxgl.Map({
        container: container.current,
        accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
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
    let loaded = false;
    instance.on("load", () => {
      loaded = true;
      setFailed(false);
      setReady(true);
    });
    instance.on("error", () => {
      if (!loaded) setFailed(true);
    });
    return () => {
      instance.remove();
      map.current = null;
    };
  }, [attempt]);
  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance) return;
    const markers = locations.map((place) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", place.location);
      Object.assign(button.style, {
        width: "14px",
        height: "14px",
        borderRadius: "50%",
        background: "#986a54",
        border: "2px solid white",
        cursor: "pointer",
      });
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
