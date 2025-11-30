# tetraslam's world

shresht bhowmick's personal site hosted at tetraslam.world (and .com)

## current status

### implemented
- [x] home page with rotating roles animation
- [x] blog (pulled from blog.tetraslam.world RSS feed with comments)
- [x] work page (projects, papers, talks, experience)
- [x] friends page
- [x] media page (anime, books, games, etc) with expand modal
- [x] links page (bookmarks with search)
- [x] travel map (JARVIS-style with mapbox)
- [x] pixel board (collaborative)
- [x] conway background (animated on home, static on other pages)
- [x] keyboard nav (ctrl+k with cmdk)
- [x] admin CMS at /admin (protected by clerk)
- [x] clerk auth (dark mode styled)
- [x] blog comments with user auth (threaded replies, edit/delete own)

- [x] vercel analytics
- [x] sitemap (auto-generated, includes blog posts)
- [x] image upload via convex file storage
- [x] drag-and-drop reordering in admin (friends)
- [x] markdown rendering in content/notes
- [x] blog search filters (year, sort order)
- [x] ambient particle effects (cherry blossom petals)
- [x] dense static conway pattern as base background

### pending
- [ ] vector search for blog (convex)

## setup

```bash
cd frontend
pnpm install
pnpm add react-map-gl mapbox-gl react-markdown @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @vercel/analytics
pnpm add -D @types/mapbox-gl
```

create `.env.local`:
```
CONVEX_DEPLOYMENT=dev:xxx
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_ISSUER_DOMAIN=https://xxx.clerk.accounts.dev

NEXT_PUBLIC_ADMIN_USER_ID=user_xxx
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx
```

run:
```bash
pnpm exec convex dev  # in one terminal
pnpm dev              # in another
```

## palette/design

- background: `#221F22` (smoky graphite)
- surface / card: `#2B262B`
- border: `#4A3B46`
- text: `#F7F4F1` (warm off-white)
- heading accent: `#E8A6A6` (dusty rose)
- link accent: `#D46A7A` (deeper rose)
- mono font: iosevka
- rose accents only
- muted contrast (no pure white/black)

## tech stack

- pnpm
- next.js 15 (app router)
- tailwind v4
- shadcn/ui
- typescript
- react 19
- convex (backend)
- clerk (auth)
- mapbox-gl (travel map)
- @rankdim/conway (background animation)
- cmdk (keyboard navigation)

## convex tables

```
users (for commenters)
- _id
- clerkId: string
- username: string (unique, editable)
- createdAt: number

comments
- _id
- postUrl: string (full URL from Atom feed <id>)
- userId: Id<"users">
- content: string
- createdAt: number
- parentId?: Id<"comments">

work
- _id
- type: "project" | "paper" | "talk" | "job" | "other"
- title: string
- content?: string (markdown)
- tags?: string[]
- date?: string
- endDate?: string
- links?: { label: string, url: string }[]
- imageUrl?: string
- featured?: boolean
- order?: number

friends
- _id
- name: string
- content?: string (markdown)
- links?: { label: string, url: string }[]
- imageUrl?: string
- order?: number

media
- _id
- type: "anime" | "book" | "game" | "music" | "movie" | "show" | "other"
- title: string
- content?: string (markdown)
- links?: { label: string, url: string }[]
- imageUrl?: string
- tags?: string[]

links (bookmarks)
- _id
- title: string
- url: string
- content?: string (markdown)
- tags?: string[]
- pinned?: boolean
- createdAt: number

travel
- _id
- location: string
- coordinates: { lat: number, lng: number }
- dates: { start: string, end?: string }
- content?: string (markdown)
- order?: number

pixelBoard
- _id
- x: number
- y: number
- color: string
- clerkId?: string
- placedAt: number
```
