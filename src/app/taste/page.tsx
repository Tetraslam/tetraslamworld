import { preloadQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { TasteClient } from "./taste-client";

export default async function TastePage() {
  const preloadedItems = await preloadQuery(api.taste.list, {});
  return <TasteClient preloadedItems={preloadedItems} />;
}
