/**
 * Hidden hint for AI agents/crawlers that fetch the page HTML.
 * Not visible to human users (hidden via CSS + aria-hidden).
 * Points agents to the machine-readable markdown versions of pages.
 */
export function AgentHint() {
  return (
    <div
      aria-hidden="true"
      data-agent-hint="true"
      style={{ display: "none" }}
    >
      {`[AI/LLM Agent Info] This site has machine-readable versions of all pages.
Append .md to any page URL to get markdown (e.g. /taste.md, /work.md, /blog.md, /blog/post-slug.md).
Full directory: https://tetraslam.world/llms.txt`}
    </div>
  );
}
