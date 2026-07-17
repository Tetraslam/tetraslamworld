import { preloadQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { api } from "../../../convex/_generated/api";
import { LinksClient } from "./links-client";

export const metadata: Metadata = {
	title: "links",
	description:
		"curated bookmarks, resources, and interesting finds from around the web.",
	alternates: {
		canonical: "/links",
		types: { "text/markdown": "/links.md" },
	},
};

export default async function LinksPage() {
	const preloadedLinks = await preloadQuery(api.links.list, {});
	return <LinksClient preloadedLinks={preloadedLinks} />;
}
