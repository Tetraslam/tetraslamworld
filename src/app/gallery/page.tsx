import { preloadQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { api } from "../../../convex/_generated/api";
import { GalleryClient } from "./gallery-client";

export const metadata: Metadata = {
	title: "gallery",
	description: "random snapshots and visual ephemera.",
	alternates: {
		canonical: "/gallery",
		types: { "text/markdown": "/gallery.md" },
	},
};

export default async function GalleryPage() {
	const preloadedImages = await preloadQuery(api.gallery.list, {});
	return <GalleryClient preloadedImages={preloadedImages} />;
}
