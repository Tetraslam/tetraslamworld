import { preloadQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { FriendsClient } from "./friends-client";

export default async function FriendsPage() {
	const preloadedFriends = await preloadQuery(api.friends.list, {});
	return <FriendsClient preloadedFriends={preloadedFriends} />;
}
