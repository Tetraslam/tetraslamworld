import { preloadQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { api } from "../../../convex/_generated/api";
import { MediaClient } from "./media-client";

export const metadata: Metadata = {
	title: "media",
	description: "anime, manga, books, games, and music i've consumed and enjoyed.",
	alternates: {
		canonical: "/media",
		types: { "text/markdown": "/media.md" },
	},
};

export default async function MediaPage() {
  const preloadedMedia = await preloadQuery(api.media.list, {});
  return <MediaClient preloadedMedia={preloadedMedia} />;
}
