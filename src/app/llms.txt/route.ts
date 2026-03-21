import { NextResponse } from "next/server";

const SITE_URL = "https://tetraslam.world";

const content = `# tetraslam.world

> Personal site of Shresht Bhowmick (tetraslam) — founding engineer @ natural.co, prev MIT Media Lab.

## Accessing content

Every page on this site has a machine-readable markdown version. Append \`.md\` to any page URL:

- ${SITE_URL}/taste.md — Design inspiration and aesthetic references
- ${SITE_URL}/work.md — Projects, papers, talks, and experience
- ${SITE_URL}/media.md — Anime, manga, books, games, music, movies, shows
- ${SITE_URL}/links.md — Curated bookmarks and resources
- ${SITE_URL}/friends.md — People i think are cool
- ${SITE_URL}/gallery.md — Photos and visual ephemera
- ${SITE_URL}/travel.md — Travel log with locations and notes
- ${SITE_URL}/blog.md — Blog posts index (thoughts, notes, ramblings)
- ${SITE_URL}/blog/{slug}.md — Individual blog post content

## About this site

Built with Next.js, Convex (real-time database), and Clerk (auth). The site uses a dusty rose (#E8A6A6) accent on smoky graphite (#221F22) background with Iosevka monospace font.

## Contact

- Site: ${SITE_URL}
- Twitter/X: @tetraslam
`;

export function GET() {
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
