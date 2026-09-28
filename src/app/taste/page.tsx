import { preloadQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { api } from "../../../convex/_generated/api";
import { TasteClient } from "./taste-client";

export const metadata: Metadata = {
  title: "taste",
  description:
    "things shresht finds beautiful: places, objects, interfaces, motion, sound, and ideas.",
  alternates: {
    canonical: "/taste",
    types: { "text/markdown": "/taste.md" },
  },
};

export default async function TastePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; quality?: string }>;
}) {
  const preloadedItems = await preloadQuery(api.taste.list, {});
  const p = await searchParams;
  return (
    <TasteClient
      preloadedItems={preloadedItems}
      initialFilter={{
        q: typeof p.q === "string" ? p.q : "",
        category: typeof p.category === "string" ? p.category : "",
        quality: typeof p.quality === "string" ? p.quality : "",
      }}
    />
  );
}
