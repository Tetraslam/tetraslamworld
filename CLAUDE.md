# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio/blog site (tetraslam.world) built with Next.js 16 (App Router), React 19, Convex backend, and Clerk authentication.

## Commands

```bash
# Development (run in separate terminals)
pnpm exec convex dev      # Convex backend
pnpm dev                  # Next.js frontend

# Build & Production
pnpm build                # Production build
pnpm start                # Start prod server

# Code Quality
pnpm lint                 # Lint with Biome
pnpm format               # Format with Biome
```

## Architecture

### Frontend (`src/`)
- **app/**: Next.js App Router pages
  - `admin/`: Clerk-protected CMS for managing content
  - `api/`: API routes (blog RSS fetching, storage, image proxy)
  - Feature pages: `blog/`, `gallery/`, `links/`, `media/`, `pixels/`, `travel/`, `work/`, `friends/`
- **components/**: React components
  - `ui/`: shadcn/ui components (New York style)
  - `providers/`: Context providers (Convex client setup)
  - Key components: `command-menu.tsx` (Cmd+K nav), `conway-background.tsx`, `ambient-particles.tsx`
- **hooks/**: Custom hooks (`use-mobile.ts`, `use-device.ts`)
- **lib/utils.ts**: `cn()` utility (clsx + tailwind-merge)

### Backend (`convex/`)
- **schema.ts**: Database schema (11 tables: users, comments, work, friends, media, links, linkSuggestions, travel, pixelBoard, gallery, emailList)
- Each feature has its own file with mutations/queries (e.g., `work.ts`, `media.ts`, `comments.ts`)
- **files.ts**: Convex file storage operations
- **auth.config.ts**: Clerk JWT integration

### Provider Hierarchy
ClerkProvider → ConvexClientProvider → CommandMenu → Page content

## Key Patterns

- **Path alias**: `@/*` maps to `./src/*`
- **Styling**: Tailwind CSS v4 with CSS variables, dark mode always on
- **Font**: Iosevka monospace
- **Color palette**: Dusty rose (#E8A6A6) accent on smoky graphite (#221F22) background
- **shadcn/ui**: Add new components via `pnpm dlx shadcn@latest add <component>`
- **Images**: Remote images from `*.convex.cloud` and `*.convex.site` are allowed

## Environment Variables

Required in `.env.local`:
- `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_JWT_ISSUER_DOMAIN`
- `NEXT_PUBLIC_ADMIN_USER_ID`
- `NEXT_PUBLIC_MAPBOX_TOKEN`

## Convex Development

When modifying Convex functions:
1. Schema changes in `convex/schema.ts` require `pnpm exec convex dev` to sync
2. Use `useMutation`/`useQuery` hooks from `convex/react` in client components
3. Admin-only mutations check `NEXT_PUBLIC_ADMIN_USER_ID` for authorization
