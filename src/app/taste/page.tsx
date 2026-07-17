import { preloadQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { api } from "../../../convex/_generated/api";
import { TasteClient } from "./taste-client";

export const metadata: Metadata = {
	title: "taste",
	description:
		"design inspiration and aesthetic references — sites, libraries, and interfaces worth learning from.",
	alternates: {
		canonical: "/taste",
		types: { "text/markdown": "/taste.md" },
	},
};

export default async function TastePage() {
  const preloadedItems = await preloadQuery(api.taste.list, {});
  return <TasteClient preloadedItems={preloadedItems} />;
}
