# Writing

Open `/admin/writing`, then choose **new note** or **new essay**. Notes can be untitled. Start typing; Markdown shortcuts and the small toolbar both work.

The save label distinguishes a copy on this device from a checkpoint saved to Git. `Ctrl/Cmd+S` saves immediately. **Preview** uses the reader layout and keeps the editor’s undo history. **Focus** hides the surrounding navigation.

## Media and rich content

Paste or drop files into the document, or use **insert → image / video / audio**. Files upload directly to private storage; publication waits for their independent backup. Interrupted uploads remain on the device and retry when connectivity returns. The insert menu also offers galleries, equations, tables, footnotes, site references, and interactive visualizations.

Use a block’s edit button for captions, alt text, credits, transcripts, and visualization settings. Drag its handle to reorder it. Table controls appear when the cursor is in a table. Rich blocks inserted from a table go after it so Markdown can preserve the structure.

The equation dialogs handle LaTeX. In Markdown source, use `$$2x$$` for an inline formula and separate `$$` lines for a display equation. Currency such as `$12,000` stays ordinary prose.

## Publishing and recovery

- **Details** holds the address, summary, date, labels, series, and social image.
- **Publish** freezes the saved draft. Later edits stay private until **update**.
- A scheduled publication freezes the revision selected when scheduling. Later edits do not change it; cancel and schedule again to choose a different version.
- **Unpublish** removes the public version and retains the draft and history.
- **History** separates draft checkpoints, publication events, and recovery copies on this device. Restoring changes the draft; it does not republish.
- If another session saved first, compare versions, adopt the saved version, explicitly replace it, or keep your local work as a separate draft. Closing the dialog retains the local copy.

For agent collaboration, **copy draft context** supplies the repository, document path, and revision. **Export Markdown** downloads the current draft; the complete portable backup is a separate CLI operation.

## Repository and CLI

Content lives in the private `Tetraslam/tetraslam-writing` repository. Application and visualization code lives here. Never copy private drafts or exports into this public repository.

Run commands from this checkout using `pnpm writing`. Local CLI access uses the existing `gh` login; browser access uses the repository-scoped GitHub App. Storage credentials are resolved through `opa`. `.env.writing.op` contains references, not secret values.

```sh
pnpm writing list
pnpm writing read <document-id>
pnpm writing history <document-id>
pnpm writing save /private/path/post.md --expected <revision>
pnpm writing save /private/path/new-post.md --new
pnpm writing upload /private/path/image.png
pnpm writing publish <document-id>                         # review
pnpm writing publish <document-id> --expected <revision> --apply
pnpm writing schedule <document-id> --expected <revision> --at <ISO-timestamp> --apply
pnpm writing cancel <document-id> --apply
pnpm writing unpublish <document-id> --expected <revision> --apply
```

Use the CLI to commit document edits so the index, revision checks, and retry receipts stay coherent. Raw Git access remains available for inspection and recovery. Do not edit a published snapshot in place.

```sh
pnpm writing export --output /private/path/new-backup
pnpm writing verify-export /private/path/new-backup
pnpm writing restore /private/path/new-backup --output /private/path/new-restoration
```

Exports include the content Git mirror, original media, comments and their user records, checksums, and an application Git bundle. Verification and restoration work without GitHub credentials. Restoration creates a new local checkout; it does not change production. Inspect the restored files before provisioning replacement services.

Limits: 1 MB per serialized document, 512 MiB per upload, 300 referenced assets per publication, and 10,000 documents. Individual repository text files (including the collection index and history) are limited to 20 MB; a write exceeding that bound is rejected before the Git ref changes.
