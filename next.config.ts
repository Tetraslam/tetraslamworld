import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // The literal ".md" can't be an App Router segment, so map the
      // /WET_MODE.md URL onto the /WET_MODE page.
      { source: "/WET_MODE.md", destination: "/WET_MODE" },
    ];
  },
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
  },
};

export default nextConfig;
