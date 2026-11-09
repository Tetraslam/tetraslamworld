import type { AuthConfig } from "convex/server";

// The development and production Clerk instances share this deployment, so
// tokens from either issuer are accepted. Admin access is still gated by
// ADMIN_USER_IDS, which lists the owner's user id in each instance.
const issuers = [
  process.env.CLERK_JWT_ISSUER_DOMAIN,
  process.env.CLERK_LIVE_ISSUER_DOMAIN,
].filter((domain): domain is string => !!domain);

export default {
  providers: issuers.map((domain) => ({ domain, applicationID: "convex" })),
} satisfies AuthConfig;
