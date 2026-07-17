import { preloadQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { api } from "../../../convex/_generated/api";
import { FriendsClient } from "./friends-client";

export const metadata: Metadata = {
	title: "friends",
	description: "people i think are cool — friends, collaborators, and co-conspirators.",
	alternates: {
		canonical: "/friends",
		types: { "text/markdown": "/friends.md" },
	},
};

export default async function FriendsPage() {
	const preloadedFriends = await preloadQuery(api.friends.list, {});
	return <FriendsClient preloadedFriends={preloadedFriends} />;
}
