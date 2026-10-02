"use client";
import { useId, useState } from "react";

// Versioned, code-owned components. Posts store data/settings, never executable JS.
export const visualizationCatalog = [
  {
    id: "station-spacing",
    version: 1,
    label: "Station spacing",
    description:
      "Explore how walking, stops, and cruising affect journey time.",
  },
] as const;
export function StationSpacing({
  initialSpacing = 1,
  distance = 10,
  speed = 60,
  dwell = 30,
}: {
  initialSpacing?: number;
  distance?: number;
  speed?: number;
  dwell?: number;
}) {
  const inputId = useId();
  const [spacing, setSpacing] = useState(
    Math.min(5, Math.max(0.2, initialSpacing)),
  );
  const length = Math.min(100, Math.max(1, distance)),
    velocity = Math.min(300, Math.max(5, speed)),
    pause = Math.min(180, Math.max(0, dwell));
  const cruise = (length / velocity) * 60,
    stops = ((length / spacing) * pause) / 60,
    walk = (spacing / 2 / 5) * 60,
    total = cruise + stops + walk;
  const stopsCount = Math.min(30, Math.max(2, Math.round(length / spacing)));
  return (
    <div className="writing-visualization">
      <svg
        viewBox="0 0 600 70"
        role="img"
        aria-label={`${stopsCount} illustrative stations along the route`}
      >
        <path d="M20 35H580" stroke="currentColor" strokeWidth="2" />
        {Array.from({ length: stopsCount }, (_, i) => (
          <circle
            // biome-ignore lint/suspicious/noArrayIndexKey: The station ordinal is its identity in this stateless model.
            key={`station-${i}`}
            cx={20 + (i * 560) / (stopsCount - 1)}
            cy="35"
            r="5"
            fill="var(--background)"
            stroke="var(--rose-deep)"
            strokeWidth="3"
          />
        ))}
      </svg>
      <label htmlFor={inputId}>
        station spacing <output>{spacing.toFixed(1)} km</output>
      </label>
      <input
        id={inputId}
        type="range"
        min=".2"
        max="5"
        step=".1"
        value={spacing}
        onChange={(e) => setSpacing(Number(e.target.value))}
      />
      <dl>
        <div>
          <dt>walking</dt>
          <dd>{walk.toFixed(1)} min</dd>
        </div>
        <div>
          <dt>stops</dt>
          <dd>{stops.toFixed(1)} min</dd>
        </div>
        <div>
          <dt>cruising</dt>
          <dd>{cruise.toFixed(1)} min</dd>
        </div>
        <div>
          <dt>total</dt>
          <dd>{total.toFixed(1)} min</dd>
        </div>
      </dl>
      <p className="writing-caption">
        illustrative model: {length} km journey, {velocity} km/h cruising,{" "}
        {pause}s dwell, 5 km/h walking. acceleration and transfers are omitted.
      </p>
    </div>
  );
}
