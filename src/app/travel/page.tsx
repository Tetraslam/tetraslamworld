import { preloadQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { TravelClient } from "./travel-client";

export default async function TravelPage() {
	const preloadedLocations = await preloadQuery(api.travel.list, {});
	return <TravelClient preloadedLocations={preloadedLocations} />;
}
