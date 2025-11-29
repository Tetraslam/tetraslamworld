"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function TravelPage() {
  const locations = useQuery(api.travel.list);

  // TODO: Implement JARVIS-style map with react-map-gl
  // For now, show a list view

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">travel</h1>
          <p className="text-muted-foreground mt-1">
            places i've been
          </p>
        </div>

        {/* Placeholder for map */}
        <div className="aspect-video bg-surface border border-border rounded flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">JARVIS-style map coming soon</p>
            <p className="text-xs mt-1">mapbox integration pending</p>
          </div>
        </div>

        {!locations ? (
          <div className="text-muted-foreground py-8 text-center">loading...</div>
        ) : locations.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            no locations added yet
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-rose">locations</h2>
            <div className="grid gap-3">
              {locations
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((loc) => (
                  <div
                    key={loc._id}
                    className="p-4 bg-surface border border-border rounded"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{loc.location}</h3>
                        <p className="text-xs text-muted-foreground">
                          {loc.coordinates.lat.toFixed(4)}, {loc.coordinates.lng.toFixed(4)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {loc.dates.start}
                          {loc.dates.end && ` - ${loc.dates.end}`}
                        </p>
                        {loc.content && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {loc.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
