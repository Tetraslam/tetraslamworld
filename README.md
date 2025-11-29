# tetraslam's world

shresht bhowmick's personal site hosted at tetraslam.world (and .com)


## plan


pages

- [ ]  home (about)
    - [ ]  about me
    - [ ]  pics
    - [ ]  media i like, aesthetics
    - [ ]  pixel board
    - [ ]  friends
    - [ ]  travel map
- [ ]  blog
- [ ]  work
    - [ ]  projects
    - [ ]  papers
    - [ ]  resume
    - [ ]  media/talks
- [ ]  contact
- [ ]  links (not mine; link dump)


features

- [ ]  analytics
- [ ]  sitemap
- [ ]  blog pulls from https://blog.tetraslam.world rss feed (blog.tetraslam.world/rss) and styles to fit my site
- [ ]  blog with comments
- [ ]  conway background (full-page, low opacity rose accent cells)
- [ ]  keyboard nav (with https://github.com/dip/cmdk)
- [ ]  search blog (filter, full text search; vector search later via convex)

aesthetics

- [ ]  neon genesis evangelion
- [ ]  prime intellect
- [ ]  nous research
- [ ]  harmonic ai (math)
- [ ]  psychohistory
- [ ]  godel terminal
- [ ]  bear blog
- [ ]  sci-fi academic

palette/design

- background: `#221F22` (smoky graphite)
- Surface / Card: `#2B262B`
- Border: `#4A3B46`
- Text: `#F7F4F1` (warm off-white)
- Heading Accent: `#E8A6A6` (dusty rose)
- Link Accent: `#D46A7A` (deeper rose)
- mono font for everything: iosevka
- rose accents only
- muted contrast (no pure white/black)

## tech stack

- pnpm
- nextjs
- tailwind v4
- shadcn/ui
- typescript
- react 19
- vercel (hosting, analytics)
- [conway](https://github.com/rankdim/conway)
- [cmdk](https://github.com/dip/cmdk)
- rss feed from blog.tetraslam.world
- convex
- clerk (auth for comments + admin)
- rss-parser
- framer-motion
- @vercel/og
- react-map-gl + mapbox-gl (travel map)
- @uiw/react-md-editor (CMS markdown editing)

## travel map (JARVIS UI)

design goals:
- dark vector basemap (mapbox dark-v11 as starting point, customize in mapbox studio)
- grid overlay with lat/long coordinate readouts in corners
- custom markers: rose accent glow, pulse animation on hover
- animated dashed flight paths between locations (svg dash-offset animation)
- HUD-style tooltips: mono font, border glow, location data + dates + notes
- subtle scan line effect or radar sweep on initial load
- zoom controls styled to match palette (custom, not default mapbox)

## CMS

admin dashboard at `/admin` (protected, only me):
- clerk auth check against my user ID
- CRUD for all content types below
- markdown editor for content fields
- image upload via convex file storage
- drag-and-drop reordering where applicable

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
- parentId?: Id<"comments"> (for threaded replies)

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
- photos?: Id<"_storage">[]
- order?: number

pixelBoard
- _id
- x: number
- y: number
- color: string
- clerkId?: string (who placed it, if logged in)
- placedAt: number
```