# Taste collection

## Contract

One entry can describe a whole thing or a specific detail. Categories identify what it is; qualities identify what Shresht notices. Entries support ordered images, muted video previews, user-played video/audio, opt-in sandboxed interactive examples, and Markdown/code/TeX. Source/credit links are separate from opening the entry. Curated order is the default; prominence is an explicit editorial choice.

Canonical state remains in the existing Convex `taste` table. New fields are optional; existing URLs, screenshots, tags, and notes are adapted on read. No backfill, deletion, fabricated entries, or rewriting of old copy. Existing 13 records were fingerprinted before work: `697f89efe3c83c489776692a0d558a0c8470b930462c44e01d64c0e480b46cf0`. Old links use stable record IDs; new entries receive unique, stable slugs. Published status defaults to true only for legacy records; new editor entries start as drafts.

Atomic unit is one entry, at most 24 media items and 64,000 serialized characters, with binary files stored separately (100 MB maximum per upload). Save compares the document revision in the same transaction. All taste writes and upload authorization require the existing server admin allowlist. Legacy partial mutations remain compatible and increment revisions, preserving fields they do not understand. New full saves cannot silently overwrite concurrent edits. Reorder is atomic and validates a complete, distinct current ID set; deletion never deletes potentially shared storage objects.

Animation ownership: index previews are muted, start only on pointer/focus intent or an explicit button, and stop offscreen/on blur/when the tab is hidden. Reduced motion disables automatic previews. Audio never autoplays. Detailed recordings use native controls. Embeds make no third-party request before explicit activation; arbitrary HTTPS examples use an opaque sandbox, with same-origin capability reserved for known external embed providers. No arbitrary HTML, shader code, or scripts are executed in the parent site.

Verification covers legacy preservation, authentication, revision conflicts, validation limits, draft visibility, slug collisions, clearing media, reorder integrity, playback lifecycle, keyboard navigation, filters and deep links, both themes, and mobile. All live verification is read-only; rich test entries are isolated fixtures.

## Presentation decisions

Filters stay visible beside search, without an extra disclosure. Media stays together before the commentary, in the editor's order; the selected cover controls the collection thumbnail only. Detail images use their natural proportions without contrasting letterbox frames. Short observations are not clipped. The editor groups source links together, keeps category/search fields visible, and shows still thumbnails beside each media item's controls.

## Verification evidence

- Convex's own typecheck and additive deployment passed. All 13 records retained the exact fingerprint above after deployment.
- 35 Vitest tests and six Node tests passed, including stale-save rejection and playback interruption. The storage fixture supplies MIME metadata omitted by convex-test's `storeBlob` implementation; it does not simulate an actual upload POST.
- A production build served on an isolated local port passed desktop/mobile checks in Chrome, in light and dark appearances. Search/category URLs, detail navigation, image enlargement, arrow keys, Escape, and focus restoration were exercised. Settled public index/detail pages and the editor passed the scoped WCAG A/AA audit.
- A temporary local-only component fixture exercised real browser video playback: explicit play advances a muted preview, scrolling it offscreen removes it, and the detail player remains paused. KaTeX rendered; an arbitrary embed created no iframe before activation and used an opaque sandbox after activation. The fixture and its synthetic recording were never stored in Convex or published.
- Authenticated live upload/save and third-party player compatibility remain unproven end-to-end. No live test submissions were made; authorization, file metadata validation, drafts, and saves were checked in the isolated backend tests.

The local preview on port 3105 now serves `.next-review`. Build the next candidate into `.next` before switching it in. Repository-wide lint still reports pre-existing failures outside this change; changed-file checks pass, with only generated Convex type warnings.
