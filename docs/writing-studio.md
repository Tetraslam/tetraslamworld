# Writing studio

Approved by Shresht. This checklist is the release scope, not a menu of optional ideas. Email delivery and a dedicated MCP server are explicitly later work. Preserve pico until the complete inventory, including unpublished drafts and their media, is imported and verified.

## Approved features

### Writing
- [x] Visual editor with Markdown shortcuts
- [x] Short notes and long-form posts
- [x] Optional titles for short notes
- [x] Formatting toolbar and block insertion
- [x] Drag-and-drop block ordering
- [x] Distraction-free writing mode
- [x] Desktop and mobile editing
- [x] Paste/drop media uploads
- [x] Autosave, local recovery, and clear save status
- [x] Revision history and restoration
- [x] Conflict detection across sessions
- [x] Preview using the actual site layout

### Content
- [x] Images, galleries, captions, alt text, and credits
- [x] Video, GIFs, audio, posters, and transcripts
- [x] Code blocks, equations, tables, quotes, and footnotes
- [x] Interactive visualizations built in the repo
- [x] Editable visualization settings
- [x] Static fallbacks for interactive content
- [x] Links to taste entries, trips, projects, and other posts
- [x] Preservation of unsupported blocks during editing

### Organization and publishing
- [x] Searchable writing desk for drafts and published posts
- [x] Private drafts and draft media
- [x] Separate draft and published versions
- [x] Publish, update, unpublish, and schedule
- [x] Editable slugs, dates, summaries, and social previews
- [x] Tags, topics, and series
- [x] Full-text search and archives
- [x] RSS, sitemap, and Markdown exports
- [x] Existing comments preserved

### Ownership and agent workflow
- [x] Private Git repository as the content source of truth
- [x] Readable, versioned content files
- [x] Separate draft checkpoints and publication history
- [x] Visualization code and datasets under source control
- [x] Original media storage, versioning, and independent backups
- [x] Complete export and tested restoration
- [x] Direct editing by this session in the repos
- [x] Shared CLI and “copy draft context”
- [x] Content-only publishing without an application rebuild

### Migration
- [x] Import every existing pico post, including drafts, and all referenced media
- [x] Preserve dates, slugs, links, and comment identities
- [x] Verify imported posts against their originals
- [x] Remove pico as a runtime dependency only after verified cutover

### Later, outside this release
- Email delivery
- Dedicated blog MCP server

## Behavioral contract

Canonical writing consists of readable files in a private content repository. The public site repository must never receive draft contents, private migration inventories, or private media. The editor and the agent operate against the same versioned document contract. Structured rich blocks must round-trip without silent loss; unsupported blocks remain intact.

An atomic authoring save includes one post and its associated text metadata/datasets in a single Git commit. A published post is a frozen revision, independent of the editable draft. Publishing verifies the expected draft and published revisions. Concurrent writers must not overwrite each other; conflicts retain the local draft. Git ref updates must be non-forced, with bounded retries for unrelated changes only. Autosave acknowledgement distinguishes local recovery from durable Git storage.

Authentication uses the existing server-side Clerk admin allowlist. Server-held repository/storage credentials never reach the browser. The public loader reads only released snapshots and released media. Scheduling must publish the intended saved revision, tolerate retries, and support cancellation without allowing an obsolete job to publish. Uploaded assets use immutable identities and verified manifests; original bytes remain recoverable independently of derived previews.

The private content repository, source repository, original assets, and manifests must suffice to restore the blog. Search/caches and any coordination data are rebuildable. Export/restore verification and a complete pico inventory are release gates. No pico writes, deletions, or DNS changes are needed for import.

## Implementation record

Initial capability questions, to resolve before relying on them:
- Private repository provisioning and least-privilege server access.
- Pico file inventory/download access, including drafts omitted from RSS.
- Media storage, independent backup location, and restore access.
- Durable scheduled publication in the deployed environment.

Faithful evidence must include two competing editor saves, a lost network acknowledgement, editing while publication occurs, a cancelled/retried scheduled publish, unauthorized draft/media reads, rich-block round trips, and restoration from exported files/assets. The largest supported document/upload shapes will be explicit and validated consistently in the editor, server, and CLI.

Mark a checkbox complete only after implementation and applicable verification. Record unavailable evidence as unproven rather than substituting intent for completion.

## Verification record, October 2026

The scoped GitHub App can access only the private writing repository. Non-forced Git ref updates are the atomic boundary. The published snapshot, schedule, index, and retry receipt commit together; Tigris holds immutable server-owned originals, with checksum-matched GitHub Release backups. Convex owns the minute publication/backup tick, activated after production verification.

- The private import contains 27 documents: 10 published snapshots and 17 private drafts. All 67 authored source copies (remote, canonical local, generated copies, and archived writing) map to accessible drafts. Research transcripts and figure-generation scripts remain verbatim supporting material in the private archive.
- `scripts/writing/verify-import.ts` checks source hashes, every document against the real editor schema, Markdown round trips, backed-up media references, original draft/publication prose, dates, and comment identity. All 67 originals have independent backups. Private inventories, titles, and evidence remain outside this public repository.
- Actual GitHub ref races, a lost save acknowledgement, frozen publication, and cancelled scheduling passed on isolated verification branches. No fixture was added to the production content branch.
- Authenticated Chrome verification covered typing/reload, undo across preview, block dragging, table/footnote editing, multi-file media and posters, paste uploads, interrupted drop uploads surviving reload, offline recovery, and scheduled publication of a frozen revision.
- Two live tabs retained different local copies. The stale save was rejected, survived reload, and was recovered into a separate draft without overwriting the winning save. A private phrase appeared in authenticated desk search and returned no public search results.
- Anonymous draft requests returned 403; private/withdrawn media returned 404. Unpublished pages returned the framework’s streamed not-found response without the withdrawn prose. Existing comment keys are unchanged.
- Desktop and 390 px mobile reader/editor checks passed without horizontal overflow. Screenshots are retained in the private runtime directory.
- Final-code export, checksum verification, and offline restoration passed for all 27 documents and 67 assets, including application source and comments.
- The deployed preview accepted a 989 KB document, rendered 43,000 paragraphs in the editor, and saved a further edit. An oversized replacement returned 400 and retained the previous version. A 512 MiB upload completed through Vercel in the preview storage fork; original verification and independent backup returned 200 in 139 seconds. Its local Blob was released only after the matching backup receipt.
- The deployed scheduling endpoint published the frozen revision, retained the later private edit, cleared the schedule, and backed up the private repository. Unpublishing then succeeded. All of these mutations used the isolated verification branch.
- Preview has branch-scoped development Clerk credentials and a private copy-on-write Tigris fork with an exact-origin CORS rule. Production retains its existing Clerk instance and original media bucket. The final read-only pico comparison found the same 79 unique files, with no additions, removals, or changes.

Tiptap 3.31.4 needed explicit compatibility handling for inline/standalone images and links around inline code. These are checked against real editor instances, not only parser JSON. Currency amounts remain prose instead of being swallowed by equation parsing; explicit inline equations serialize with double-dollar delimiters and existing symbolic single-dollar formulas remain supported. Unsupported table content and block HTML remain intact as source. A repository write larger than the reader’s 20 MB bound is rejected before mutation.

Repository-wide Biome still reports pre-existing formatting/accessibility failures outside this feature. The writing changes are checked separately against the PR base. See [Writing guide](writing-guide.md) for authoring and recovery commands.

## Production cutover

PR #6 merged into `rewrite` as `0372de2` on October 6, 2026 (UTC). Vercel deployed native writing to `www.tetraslam.world`; all 82 tests, TypeScript, changed-file lint, and deployment checks passed. No automatic reviews or unresolved review threads were present.

The authenticated production desk returned 27 documents, including all 17 private drafts and no verification fixtures. Anonymous checks verified all 10 native articles, their original dates/comment IDs, RSS, sitemap, Markdown exports, and all 32 publicly referenced media objects. Draft APIs returned 403, private media returned 404, and the worker rejected unsigned requests. Chrome confirmed live reader images and literal currency amounts.

The worker is active on the existing `valuable-mandrill-918` backend. Its production invocation returned successfully, and subsequent autonomous minute ticks completed without errors. Pico was neither modified nor removed; `WRITING_SOURCE=git` selects native writing. For rollback, remove that setting and redeploy the previous application revision; disable `WRITING_PUBLICATION_ENDPOINT` before reverting the writing routes.
