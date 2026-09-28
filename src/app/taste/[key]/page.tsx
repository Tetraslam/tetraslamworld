import { fetchQuery, preloadedQueryResult, preloadQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { tasteKey } from "../../../../shared/taste";
import { TasteEntryClient } from "./taste-entry-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}): Promise<Metadata> {
  const { key } = await params;
  const item = await fetchQuery(api.taste.getByKey, { key });
  return {
    title: item?.title ?? "entry not found",
    description: item?.observation || undefined,
    alternates: {
      canonical: `/taste/${encodeURIComponent(item ? tasteKey(item) : key)}`,
      types: { "text/markdown": `/taste/${encodeURIComponent(key)}.md` },
    },
  };
}
export default async function TasteEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ q?: string; category?: string; quality?: string }>;
}) {
  const [{ key }, filter, preloaded] = await Promise.all([
    params,
    searchParams,
    preloadQuery(api.taste.list, {}),
  ]);
  const item = preloadedQueryResult(preloaded).find(
    (item) => tasteKey(item) === key || item._id === key,
  );
  if (!item) notFound();
  return (
    <TasteEntryClient
      key={item._id}
      id={item._id}
      preloadedItems={preloaded}
      filter={{
        q: typeof filter.q === "string" ? filter.q : "",
        category: typeof filter.category === "string" ? filter.category : "",
        quality: typeof filter.quality === "string" ? filter.quality : "",
      }}
    />
  );
}
