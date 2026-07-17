import { preloadQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { api } from "../../../convex/_generated/api";
import { TravelClient } from "./travel-client";

export const metadata: Metadata = {
	title: "travel",
	description: "places i've been — an interactive globe of travel stories.",
	alternates: {
		canonical: "/travel",
		types: { "text/markdown": "/travel.md" },
	},
};

export default async function TravelPage() {
	const preloadedLocations = await preloadQuery(api.travel.list, {});
	return <TravelClient preloadedLocations={preloadedLocations} />;
}
