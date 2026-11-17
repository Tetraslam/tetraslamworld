/**
 * Pure helpers for finding a preview image for a source link. The network
 * side lives in src/lib/tetrastack/previews.ts.
 */

export type Preview = {
  /** The page the preview illustrates (the source link). */
  source: string;
  /** Image URL at the origin. Served to visitors through our own route. */
  image: string;
  width: number;
  height: number;
  /** Who made or holds the image, when the origin says so. */
  credit?: string;
  /** Short description used as alt text. */
  alt?: string;
};

export type PreviewPlan =
  | { kind: "met"; id: string }
  | { kind: "artic"; id: string }
  | { kind: "youtube"; id: string }
  | { kind: "page" };

export function planPreview(url: string): PreviewPlan {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const met = /^\/art\/collection\/search\/(\d+)/.exec(parsed.pathname);
    if (host === "metmuseum.org" && met) return { kind: "met", id: met[1] };
    const artic = /^\/artworks\/(\d+)/.exec(parsed.pathname);
    if (host === "artic.edu" && artic) return { kind: "artic", id: artic[1] };
    if (host === "youtu.be")
      return { kind: "youtube", id: parsed.pathname.slice(1) };
    if (host === "youtube.com" && parsed.searchParams.get("v"))
      return { kind: "youtube", id: parsed.searchParams.get("v") as string };
  } catch {
    // fall through
  }
  return { kind: "page" };
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/gi, "/");
}

function attributes(tag: string) {
  const found: Record<string, string> = {};
  for (const match of tag.matchAll(
    /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g,
  ))
    found[match[1].toLowerCase()] = decodeEntities(
      match[2] ?? match[3] ?? match[4] ?? "",
    );
  return found;
}

/** og:image (or twitter:image, or a declared image_src) from page HTML. */
export function pageImage(html: string, base: string) {
  const metas: Record<string, string> = {};
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    const key = (attrs.property || attrs.name || "").toLowerCase();
    if (key && attrs.content && !(key in metas)) metas[key] = attrs.content;
  }
  let image: string | undefined =
    metas["og:image:secure_url"] ||
    metas["og:image"] ||
    metas["og:image:url"] ||
    metas["twitter:image"] ||
    metas["twitter:image:src"];
  if (!image) {
    const link = [...html.matchAll(/<link\b[^>]*>/gi)]
      .map((m) => attributes(m[0]))
      .find((attrs) => attrs.rel?.toLowerCase() === "image_src");
    image = link?.href;
  }
  if (!image) return null;
  try {
    const url = new URL(image, base);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return {
      image: url.href,
      alt:
        metas["og:image:alt"] ||
        metas["twitter:image:alt"] ||
        metas["og:title"],
      site: metas["og:site_name"],
      width: Number(metas["og:image:width"]) || undefined,
      height: Number(metas["og:image:height"]) || undefined,
    };
  } catch {
    return null;
  }
}

/** Pixel size of a PNG, GIF, JPEG, or WebP from its first bytes. */
export function imageSize(
  bytes: Uint8Array,
): { width: number; height: number; type: string } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (start: number, length: number) =>
    String.fromCharCode(...bytes.subarray(start, start + length));
  if (bytes.length >= 24 && ascii(1, 3) === "PNG")
    return {
      width: view.getUint32(16),
      height: view.getUint32(20),
      type: "image/png",
    };
  if (bytes.length >= 10 && ascii(0, 3) === "GIF")
    return {
      width: view.getUint16(6, true),
      height: view.getUint16(8, true),
      type: "image/gif",
    };
  if (bytes.length >= 30 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    const chunk = ascii(12, 4);
    if (chunk === "VP8 ")
      return {
        width: view.getUint16(26, true) & 0x3fff,
        height: view.getUint16(28, true) & 0x3fff,
        type: "image/webp",
      };
    if (chunk === "VP8L") {
      const bits = view.getUint32(21, true);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
        type: "image/webp",
      };
    }
    if (chunk === "VP8X")
      return {
        width: 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)),
        height: 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)),
        type: "image/webp",
      };
  }
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = bytes[offset + 1];
      if (
        marker === 0xd8 ||
        (marker >= 0xd0 && marker <= 0xd7) ||
        marker === 0x01 ||
        marker === 0xff
      ) {
        offset += marker === 0xff ? 1 : 2;
        continue;
      }
      const length = view.getUint16(offset + 2);
      // SOF markers carry the frame size; skip DHT (c4), JPG (c8), DAC (cc).
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      )
        return {
          height: view.getUint16(offset + 5),
          width: view.getUint16(offset + 7),
          type: "image/jpeg",
        };
      offset += 2 + length;
    }
  }
  return null;
}

/** Hosts we never fetch from on a visitor's behalf. */
export function isPrivateHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  )
    return true;
  if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.)/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  if (
    host === "::1" ||
    host.startsWith("fc") ||
    host.startsWith("fd") ||
    host.startsWith("fe80")
  )
    return host.includes(":");
  return false;
}

/** Path that serves a source's preview image from this site. */
export function previewPath(source: string) {
  return `/api/taste/preview?source=${encodeURIComponent(source)}`;
}
