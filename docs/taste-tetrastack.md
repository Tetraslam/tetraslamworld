# Taste, from tetrastack

`/taste` is built from [tetrastack](https://github.com/Tetraslam/tetrastack). Tetrastack holds the structure and the words; the Convex taste collection holds hand-picked images. The page joins the two and finds images for everything else.

## Adding or editing

- **Text** (a constant, a direction, a source, a reference, a library, a rejection): edit the markdown in tetrastack and push to `main`. The tetrastack skill already does this. Nothing in this repo changes.
- **A new direction**: add `directions/<slug>.md` in the usual shape (frontmatter `direction` and `status`, a one-line summary, `## sources`, `## learned in practice`, `## on the web`, `## avoid`) and a line in `taste.md`'s directions list. The list sets the order; a file the list doesn't mention yet still appears, last. Its page is `/taste/directions/<slug>`.
- **A new stack layer**: add `stack/<layer>.md` and a row in the README's stack table (the table sets the order).
- **Images you choose yourself**: add an entry in admin → taste, as before. Link it from tetrastack with `https://tetraslam.world/taste/<key>` (as `taste.md` already does), or link the same page the entry's URL points at. Either way the page uses the entry's cover instead of a found image, and the title opens the entry.
- **Everything else gets an image automatically.** Met and Art Institute of Chicago links use the museums' open-access APIs (with artist, date, and credit). Other links use the page's `og:image`. Links without one show text only.

New sections, headings, or list items that the parser doesn't recognise still render as markdown, so writing tetrastack the way it's already written is enough.

## When changes appear

| What changed | Where it's cached | Shows up |
| --- | --- | --- |
| tetrastack markdown | `unstable_cache`, tag `tetrastack`, 1 hour | within an hour, or immediately via the webhook |
| Convex taste entries | page ISR, 5 minutes | within 5 minutes |
| found images | `unstable_cache`, tag `taste-previews`, 1 week; image route CDN cache 1 day + 1 week stale | weekly |

The whole repository is read in one request (`codeload.github.com/.../tar.gz/refs/heads/main`), so every file comes from the same commit. The page shows that commit and its date under the intro.

**Immediate refresh:** add a GitHub webhook on tetrastack for push events, pointing at `https://tetraslam.world/api/taste/revalidate`, content type `application/json`, with a secret, and set the same secret as `TETRASTACK_WEBHOOK_SECRET` on Vercel. By hand: `curl -X POST -H "x-revalidate-secret: $REVALIDATE_SECRET" https://tetraslam.world/api/taste/revalidate`. Without a configured secret the route refuses every request.

## Failure

- **GitHub unreachable:** the last good copy keeps serving (cached data and ISR pages are only replaced by a successful render). On a cold start with no cache, the page uses the vendored snapshot in `src/lib/tetrastack/snapshot.json` and says so under the intro. Refresh the snapshot now and then with `pnpm tetrastack:snapshot`; nothing depends on it being current.
- **Convex unreachable:** the page renders without entry images and without "also collected".
- **A source's image fails:** that source shows text only. Lookups that fail on the network aren't cached, so they're retried; a page with no image is cached for a week. Rendering waits at most 20 seconds for lookups, and anything still pending lands in the cache for the next render.

## Images

Found images are never hotlinked. `/api/taste/preview?source=<url>` serves the image for a source **only if that source is linked from the current tetrastack**, so it isn't an open proxy. It refuses private and local hosts and non-raster types, and returns images with `nosniff` and a sandboxing CSP. `next/image` then resizes them. Image sizes are read from the file headers when they're found, so every frame reserves its final shape.

Credits: museum images carry the artist, date, and institution; other found images show the site name when it adds something beyond the title. Every picture links to its source.

## Local preview

`TETRASTACK_DIR=~/Programming/tetrastack pnpm dev` reads a local clone instead of GitHub, to preview tetrastack edits before pushing them.

## For agents

`/taste.md` is `taste.md` with links that work from this site, followed by the list of direction files, every stack layer, `rejected.md`, and any collected entries tetrastack doesn't mention. `/taste/directions/<slug>.md` is that direction's file plus the images found for its sources. `/taste/<key>.md` is unchanged.

## Where the code is

- `shared/tetrastack.ts`: parsing and link rewriting (pure, tested in `tests/tetrastack.test.ts`).
- `shared/taste-book.ts`: joining links with Convex entries.
- `shared/previews.ts`, `src/lib/tetrastack/previews.ts`: finding and sizing images.
- `src/lib/tetrastack/load.ts`: fetching tetrastack, caching, fallback.
- `src/app/taste/page.tsx`, `src/app/taste/directions/[slug]/page.tsx`, `src/components/taste/book/`: the pages.
- `src/app/taste-book.css`: their styles.
