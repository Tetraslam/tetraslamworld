# Writing studio

Approved by Shresht. This checklist is the release scope, not a menu of optional ideas. Email delivery and a dedicated MCP server are explicitly later work. Preserve pico until the complete inventory, including unpublished drafts and their media, is imported and verified.

## Approved features

### Writing
- [ ] Visual editor with Markdown shortcuts
- [ ] Short notes and long-form posts
- [ ] Optional titles for short notes
- [ ] Formatting toolbar and block insertion
- [ ] Drag-and-drop block ordering
- [ ] Distraction-free writing mode
- [ ] Desktop and mobile editing
- [ ] Paste/drop media uploads
- [ ] Autosave, local recovery, and clear save status
- [ ] Revision history and restoration
- [ ] Conflict detection across sessions
- [ ] Preview using the actual site layout

### Content
- [ ] Images, galleries, captions, alt text, and credits
- [ ] Video, GIFs, audio, posters, and transcripts
- [ ] Code blocks, equations, tables, quotes, and footnotes
- [ ] Interactive visualizations built in the repo
- [ ] Editable visualization settings
- [ ] Static fallbacks for interactive content
- [ ] Links to taste entries, trips, projects, and other posts
- [ ] Preservation of unsupported blocks during editing

### Organization and publishing
- [ ] Searchable writing desk for drafts and published posts
- [ ] Private drafts and draft media
- [ ] Separate draft and published versions
- [ ] Publish, update, unpublish, and schedule
- [ ] Editable slugs, dates, summaries, and social previews
- [ ] Tags, topics, and series
- [ ] Full-text search and archives
- [ ] RSS, sitemap, and Markdown exports
- [ ] Existing comments preserved

### Ownership and agent workflow
- [ ] Private Git repository as the content source of truth
- [ ] Readable, versioned content files
- [ ] Separate draft checkpoints and publication history
- [ ] Visualization code and datasets under source control
- [ ] Original media storage, versioning, and independent backups
- [ ] Complete export and tested restoration
- [ ] Direct editing by this session in the repos
- [ ] Shared CLI and “copy draft context”
- [ ] Content-only publishing without an application rebuild

### Migration
- [ ] Import every existing pico post, including drafts, and all referenced media
- [ ] Preserve dates, slugs, links, and comment identities
- [ ] Verify imported posts against their originals
- [ ] Remove pico as a runtime dependency only after verified cutover

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
