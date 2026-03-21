import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default clerkMiddleware(async (_auth, request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // Rewrite /{page}.md requests to /api/md/{page}
  if (pathname.endsWith(".md") && !pathname.startsWith("/api/") && !pathname.startsWith("/_next/")) {
    const pagePath = pathname.slice(0, -3); // Remove .md
    const url = request.nextUrl.clone();
    url.pathname = `/api/md${pagePath}`;
    return NextResponse.rewrite(url);
  }
});

export const config = {
  matcher: [
    // Match .md requests for markdown API
    "/:path*.md",
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
