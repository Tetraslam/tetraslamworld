"use client";

import { type Preloaded, usePreloadedQuery } from "convex/react";
import { Markdown } from "@/components/markdown";
import type { api } from "../../../convex/_generated/api";

export function WetModeClient({
  preloadedDoc,
}: {
  preloadedDoc: Preloaded<typeof api.wetMode.get>;
}) {
  const doc = usePreloadedQuery(preloadedDoc);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {doc?.content ? (
        <Markdown content={doc.content} />
      ) : (
        <p className="text-muted-foreground">nothing here yet.</p>
      )}
    </div>
  );
}
