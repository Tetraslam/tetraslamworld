import "server-only";
import { unstable_cache } from "next/cache";
import {
  imageSize,
  isPrivateHost,
  type Preview,
  pageImage,
  planPreview,
} from "../../../shared/previews";

/**
 * Finds a preview image for a source link and caches what it found for a
 * week. Museum links use their open-access APIs; anything else uses the
 * page's og:image. The image itself is fetched once here to learn its size,
 * so the page can reserve the right shape before it loads.
 */

const USER_AGENT =
  "Mozilla/5.0 (compatible; tetraslam.world taste previews; +https://tetraslam.world/taste)";
const WEEK = 60 * 60 * 24 * 7;
const MAX_HTML = 768 * 1024;
const MAX_IMAGE = 12 * 1024 * 1024;

/** A failure worth caching: the source exists but offers no image. */
class NoImage extends Error {}

function safeUrl(value: string) {
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    isPrivateHost(url.hostname)
  )
    throw new NoImage(`refusing ${url.hostname}`);
  return url;
}

async function get(url: string, timeout = 6000) {
  const response = await fetch(safeUrl(url), {
    headers: { "User-Agent": USER_AGENT, Accept: "*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(timeout),
    cache: "no-store",
  });
  if (response.url) safeUrl(response.url);
  return response;
}

async function readLimited(response: Response, limit: number) {
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < limit) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
  }
  await reader.cancel().catch(() => {});
  const out = new Uint8Array(Math.min(size, limit));
  let offset = 0;
  for (const chunk of chunks) {
    const part = chunk.subarray(0, out.length - offset);
    out.set(part, offset);
    offset += part.length;
    if (offset >= out.length) break;
  }
  return out;
}

/** Downloads enough of an image to confirm it's a raster and get its size. */
export async function fetchImage(url: string) {
  const response = await get(url, 10000);
  if (!response.ok) throw new Error(`image ${response.status}`);
  const type = response.headers.get("content-type") ?? "";
  if (!type.startsWith("image/") || type.includes("svg"))
    throw new NoImage(`not a raster image: ${type}`);
  const bytes = await readLimited(response, MAX_IMAGE);
  return { bytes, type, size: imageSize(bytes) };
}

type Found = Omit<Preview, "source" | "width" | "height"> & {
  width?: number;
  height?: number;
};

async function museum(source: string): Promise<Found | null> {
  const plan = planPreview(source);
  if (plan.kind === "met") {
    const response = await get(
      `https://collectionapi.metmuseum.org/public/collection/v1/objects/${plan.id}`,
    );
    if (!response.ok) throw new Error(`met ${response.status}`);
    const object = (await response.json()) as {
      primaryImageSmall?: string;
      title?: string;
      artistDisplayName?: string;
      objectDate?: string;
    };
    if (!object.primaryImageSmall) throw new NoImage("met: no open image");
    return {
      image: object.primaryImageSmall,
      alt: object.title,
      credit: [
        object.artistDisplayName,
        object.objectDate,
        "the metropolitan museum of art, open access",
      ]
        .filter(Boolean)
        .join(" · "),
    };
  }
  if (plan.kind === "artic") {
    const response = await get(
      `https://api.artic.edu/api/v1/artworks/${plan.id}?fields=title,image_id,artist_title,date_display,is_public_domain,thumbnail`,
    );
    if (!response.ok) throw new Error(`artic ${response.status}`);
    const { data } = (await response.json()) as {
      data?: {
        title?: string;
        image_id?: string;
        artist_title?: string;
        date_display?: string;
        is_public_domain?: boolean;
        thumbnail?: { width?: number; height?: number; alt_text?: string };
      };
    };
    if (!data?.image_id) throw new NoImage("artic: no image");
    return {
      image: `https://www.artic.edu/iiif/2/${data.image_id}/full/843,/0/default.jpg`,
      alt: data.thumbnail?.alt_text || data.title,
      credit: [
        data.artist_title,
        data.date_display,
        data.is_public_domain
          ? "art institute of chicago, public domain"
          : "art institute of chicago",
      ]
        .filter(Boolean)
        .join(" · "),
    };
  }
  if (plan.kind === "youtube")
    return { image: `https://i.ytimg.com/vi/${plan.id}/hqdefault.jpg` };
  return null;
}

async function page(source: string): Promise<Found> {
  const response = await get(source);
  if (!response.ok) throw new Error(`page ${response.status}`);
  const type = response.headers.get("content-type") ?? "";
  if (type.startsWith("image/") && !type.includes("svg"))
    return { image: response.url || source };
  if (!type.includes("html")) throw new NoImage(`page is ${type}`);
  const html = new TextDecoder().decode(await readLimited(response, MAX_HTML));
  const found = pageImage(html, response.url || source);
  if (!found) throw new NoImage("no og:image");
  return {
    image: found.image,
    alt: found.alt,
    credit: found.site?.toLowerCase(),
  };
}

async function resolve(source: string): Promise<Preview | null> {
  try {
    const found = (await museum(source)) ?? (await page(source));
    const image = await fetchImage(found.image);
    if (!image.size) throw new NoImage("unreadable image");
    return {
      source,
      image: found.image,
      width: image.size.width,
      height: image.size.height,
      credit: found.credit,
      alt: found.alt,
    };
  } catch (error) {
    if (error instanceof NoImage) return null;
    // Network trouble: don't cache, try again next time.
    throw error;
  }
}

const cached = unstable_cache(resolve, ["taste-preview-v1"], {
  revalidate: WEEK,
  tags: ["taste-previews"],
});

/** Preview for one source, or null. Never throws. */
export async function getPreview(source: string) {
  try {
    return await cached(source);
  } catch {
    return null;
  }
}

/**
 * The same, as one cache entry per set of sources, so a page render reads one
 * entry instead of one per source. It refreshes hourly from the per-source
 * cache above, which is what actually holds the week-long results.
 */
const cachedSet = unstable_cache(
  async (sources: string[]) => [...(await collect(sources)).values()],
  ["taste-preview-set-v1"],
  { revalidate: 3600, tags: ["taste-previews"] },
);

export async function getPreviews(sources: string[]) {
  const unique = [...new Set(sources)].sort();
  try {
    const found = await cachedSet(unique);
    return new Map(found.map((preview) => [preview.source, preview]));
  } catch {
    return collect(unique);
  }
}

/**
 * Previews for many sources, a few at a time. Stops waiting at the deadline
 * so a slow site can't hold up the page; whatever it was fetching still lands
 * in the cache for the next render.
 */
async function collect(
  sources: string[],
  { concurrency = 12, deadline = 20000 } = {},
): Promise<Map<string, Preview>> {
  const found = new Map<string, Preview>();
  const queue = [...new Set(sources)];
  const stop = Date.now() + deadline;
  const work = Array.from({ length: concurrency }, async () => {
    while (queue.length && Date.now() < stop) {
      const source = queue.shift() as string;
      const preview = await getPreview(source);
      if (preview) found.set(source, preview);
    }
  });
  await Promise.race([
    Promise.all(work),
    new Promise((resolve) => setTimeout(resolve, deadline)),
  ]);
  return new Map(found);
}
