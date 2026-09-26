import "server-only";
import { fetchQuery } from "convex/nextjs";
import { unstable_cache } from "next/cache";
import { api } from "../../convex/_generated/api";
import { DEFAULT_HOME } from "../../shared/home-content";

export const HOME_CONTENT_TAG = "home-content";
const getCachedHome = unstable_cache(
  () => fetchQuery(api.homepage.get, {}),
  ["home-content-v1"],
  { tags: [HOME_CONTENT_TAG], revalidate: 60 },
);

export async function getHomeContent() {
  try {
    return await getCachedHome();
  } catch (error) {
    // Permit the frontend preview before its additive backend deployment.
    // Other failures must not silently replace a saved bio with old copy.
    if (
      error instanceof Error &&
      /could not find (?:public )?function/i.test(error.message)
    )
      return DEFAULT_HOME;
    throw error;
  }
}
