import { preloadQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { WorkClient } from "./work-client";

export default async function WorkPage() {
	const preloadedWork = await preloadQuery(api.work.list, {});
	return <WorkClient preloadedWork={preloadedWork} />;
}
