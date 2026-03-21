import { preloadQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { GalleryClient } from "./gallery-client";

export default async function GalleryPage() {
	const preloadedImages = await preloadQuery(api.gallery.list, {});
	return <GalleryClient preloadedImages={preloadedImages} />;
}
