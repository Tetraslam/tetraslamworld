# V5 public-site design

White paper, dark botanical ink, terracotta links, serif reading typography, and the still terrace illustration. No decorative labels, animated canvas, ambient particles, study numbers, or redundant page subtitles. Content and navigation carry the design.

Boundary: public presentation only. Existing Convex queries and content ordering remain authoritative. No schema changes, database edits, seed data, or test submissions. Existing user-initiated actions remain available. Admin keeps its existing chrome and dark palette in a scoped container. Public text/markdown routes remain intact.

Shared shell owns navigation and page widths. Native links/disclosures handle navigation; existing query-backed collections retain filtering. Travel becomes an accessible place index with optional map selection and real photographs. Evidence: production build, changed-file checks, desktop/mobile inspection of all public routes, real-data search and view interactions without writes.

## Implemented

- The illustrated home now lives at `/`; `/terrace` redirects there. Animation code and its production assets were removed. The still artwork is also used in the social preview.
- Shared paper palette, serif typography, navigation, minimal footer, plain section headings, and text filters cover all public collections. Articles have an open reading layout. Taste entries show the actual design notes alongside screenshots. Gallery captions are visible without hover.
- Media and gallery viewers use the existing Radix Dialog components for focus trapping, Escape, and explicit focus restoration. Media covers no longer autoplay. Travel keeps real coordinates, notes, and photos, with a light map and a text place index. The pixel board fits narrow screens; its backend mutation is unchanged.
- Loading, error, and not-found pages use the same restrained presentation. Cmd+K remains available without a floating advertisement. Admin retains dark scoped variables and sign-in access.

## Editorial and interaction pass

Public content remains read-only during development. Work highlights are a local presentation choice (SHFLA, re:zero, Pocket Realms); every other record remains visible. User-authored prose stays intact. Tags remain searchable metadata but are removed from work and link displays. Writing groups chronologically by year; links use one topic selector and optional sorting. Taste notes are visible. Media categories use a single browsing model and preserve alternate images when opening crossover entries.

Travel selection is owned by the URL fragment (stable record ID), with real anchors, back/forward restoration, and mobile focus on the selected notes. Map markers delegate to the same selection mechanism.

Mosaic atomic unit: one existing `pixelBoard.place` call with zero-based coordinates, chosen colour, and existing optional identity arguments. The database remains authoritative; selecting, keyboard navigation, changing colours, and cancelling never write. Only explicit Place submits. The editor locks synchronously during a pending write, retains the draft on failure, and reports completion without recolouring other cells. Existing cell colours are rendered verbatim. No backend or schema changes. Evidence: isolated navigation and submission-gate tests with a stub mutation (including failure/double submission), read-only browser checks against live data, keyboard and narrow-screen checks.

Subscription retains the existing Clerk-mediated API contract. A quiet disclosure explains sign-in and exposes the existing action; it does not collect arbitrary emails or silently change the backend. No live submissions in verification.

Pass verification: inspected work, writing, links, and mosaic compositions; verified 390px layouts across all collections without horizontal overflow. Tested subscription disclosure without submitting, zero-result bookmark search, suggestion-dialog dismissal/focus return without submitting, gallery/media next/previous and Escape focus return, navigation search, mosaic arrow movement with one tab stop, Escape cancellation, mobile travel selection moving focus to notes, browser Back restoring the previous place, and a direct travel URL restoring its place on reload. Four isolated tests exercise mosaic navigation bounds, duplicate pending writes, submitted-draft snapshots, rejected-write recovery, and invalid-payload rejection. The live placement and subscription mutations were intentionally not invoked; their existing contracts were read and left unchanged.

Chrome inspection covered the home and all nine collection routes at desktop and 390px mobile width, with no horizontal overflow. Real data loaded for work, friends, media, links, taste, travel, gallery, writing, and pixels. Tested bookmark search, taste search, travel place selection, an actual blog article, gallery/media Escape and focus restoration, and Cmd+K. No database mutations or form submissions were made during verification. Production build includes TypeScript validation. Repository-wide lint has known pre-existing failures outside this change.
