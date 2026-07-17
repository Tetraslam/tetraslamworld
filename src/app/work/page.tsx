import { preloadQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { api } from "../../../convex/_generated/api";
import { WorkClient } from "./work-client";

export const metadata: Metadata = {
	title: "work",
	description:
		"projects, experience, papers, and talks — things shresht has built, written, and done.",
	alternates: {
		canonical: "/work",
		types: { "text/markdown": "/work.md" },
	},
};

export default async function WorkPage() {
	const preloadedWork = await preloadQuery(api.work.list, {});
	return <WorkClient preloadedWork={preloadedWork} />;
}
