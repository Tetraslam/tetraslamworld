import { preloadQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { WetModeClient } from "./wet-mode-client";

export default async function WetModePage() {
  const preloadedDoc = await preloadQuery(api.wetMode.get, {});
  return <WetModeClient preloadedDoc={preloadedDoc} />;
}
