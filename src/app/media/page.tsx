import { preloadQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { MediaClient } from "./media-client";

export default async function MediaPage() {
  const preloadedMedia = await preloadQuery(api.media.list, {});
  return <MediaClient preloadedMedia={preloadedMedia} />;
}
