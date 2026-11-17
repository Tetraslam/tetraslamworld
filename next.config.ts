import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  images: {
    // A local Convex backend serves files from 127.0.0.1, which the image
    // optimizer refuses; serve them as-is in that preview setup only.
    unoptimized:
      process.env.NODE_ENV === "development" &&
      !!process.env.NEXT_PUBLIC_CONVEX_URL?.startsWith("http://127.0.0.1"),
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
