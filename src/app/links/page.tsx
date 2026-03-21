import { preloadQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { LinksClient } from "./links-client";

export default async function LinksPage() {
	const preloadedLinks = await preloadQuery(api.links.list, {});
	return <LinksClient preloadedLinks={preloadedLinks} />;
}
