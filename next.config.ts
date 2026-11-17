import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.convex.cloud",
      },
      {
        protocol: "https",
        hostname: "**.convex.site",
      },
    ],
    localPatterns: [
      // Static files under public/.
      { pathname: "/**", search: "" },
      // Taste previews for tetrastack sources (see src/app/api/taste/preview).
      { pathname: "/api/taste/preview" },
    ],
  },
};

export default nextConfig;
