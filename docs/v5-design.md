# V5 public-site design

White paper, dark botanical ink, terracotta links, serif reading typography, and the still terrace illustration. No decorative labels, animated canvas, ambient particles, study numbers, or redundant page subtitles. Content and navigation carry the design.

Boundary: public presentation only. Existing Convex queries and content ordering remain authoritative. No schema changes, database edits, seed data, or test submissions. Existing user-initiated actions remain available. Admin keeps its existing chrome and dark palette in a scoped container. Public text/markdown routes remain intact.

Shared shell owns navigation and page widths. Native links/disclosures handle navigation; existing query-backed collections retain filtering. Travel becomes an accessible place index with optional map selection and real photographs. Evidence: production build, changed-file checks, desktop/mobile inspection of all public routes, real-data search and view interactions without writes.

## Implemented

- The illustrated home now lives at `/`; `/terrace` redirects there. Animation code and its production assets were removed. The still artwork is also used in the social preview.
- Shared paper palette, serif typography, navigation, minimal footer, plain section headings, and text filters cover all public collections. Articles have an open reading layout. Taste entries expose the actual design notes through disclosures. Gallery captions are visible without hover.
- Media and gallery viewers use native project Dialog components for focus trapping, Escape, and explicit focus restoration. Media covers no longer autoplay. Travel keeps real coordinates, notes, and photos, with a light map and a text place index. The pixel board fits narrow screens; its existing write action is unchanged.
- Loading, error, and not-found pages use the same restrained presentation. Cmd+K remains available without a floating advertisement. Admin retains dark scoped variables and sign-in access.

## Verification

Chrome inspection covered the home and all nine collection routes at desktop and 390px mobile width, with no horizontal overflow. Real data loaded for work, friends, media, links, taste, travel, gallery, writing, and pixels. Tested bookmark search, taste search, travel place selection, an actual blog article, gallery/media Escape and focus restoration, and Cmd+K. No database mutations or form submissions were made during verification. Production build includes TypeScript validation. Repository-wide lint has known pre-existing failures outside this change.
