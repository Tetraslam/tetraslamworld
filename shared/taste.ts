import type { GenericId } from "convex/values";

export const TASTE_CATEGORIES = [
  {
    id: "objects",
    label: "objects & products",
    examples: "Furniture, cameras, lamps, tools, watches, everyday objects.",
  },
  {
    id: "websites",
    label: "websites",
    examples:
      "A whole site, one page, navigation, or a particular interaction.",
  },
  {
    id: "software",
    label: "apps & software",
    examples: "Interfaces, creative tools, developer tools, operating systems.",
  },
  {
    id: "vehicles",
    label: "vehicles",
    examples: "Cars, bicycles, trains, aircraft, ships, dashboards and cabins.",
  },
  {
    id: "motion",
    label: "motion & interactions",
    examples: "Transitions, loading sequences, effects, gesture responses.",
  },
  {
    id: "shaders",
    label: "shaders & generative art",
    examples: "Dithering, light, particles, procedural forms, simulations.",
  },
  {
    id: "architecture",
    label: "architecture & interiors",
    examples:
      "Façades, staircases, libraries, workshops, courtyards, lighting.",
  },
  {
    id: "places",
    label: "landscapes & public space",
    examples:
      "Gardens, plazas, waterfronts, paths, shade and gathering places.",
  },
  {
    id: "infrastructure",
    label: "infrastructure",
    examples:
      "Stations, bridges, canals, power plants, networks and logistics.",
  },
  {
    id: "mechanisms",
    label: "mechanisms & engineering",
    examples:
      "Watch movements, linkages, instruments, circuit layouts, joints.",
  },
  {
    id: "lettering",
    label: "typography & writing systems",
    examples:
      "Typefaces, inscriptions, calligraphy, scripts and conlang glyphs.",
  },
  {
    id: "maps",
    label: "maps & diagrams",
    examples:
      "Atlases, transit maps, scientific figures, fictional cartography.",
  },
  {
    id: "print",
    label: "books & printed matter",
    examples: "Layouts, covers, bindings, manuals, newspapers and marginalia.",
  },
  {
    id: "identity",
    label: "identity & wayfinding",
    examples: "Signage, symbols, uniforms, liveries and visual identities.",
  },
  {
    id: "materials",
    label: "materials & craft",
    examples:
      "Glaze, joinery, weaving, patina, finishes, material transitions.",
  },
  {
    id: "fashion",
    label: "fashion & costume",
    examples:
      "Silhouettes, tailoring, jewellery, footwear and character costumes.",
  },
  {
    id: "photography",
    label: "photography",
    examples: "Framing, light, colour relationships, and photographic series.",
  },
  {
    id: "art",
    label: "painting & sculpture",
    examples: "Paintings, drawings, sculpture, installations, composition.",
  },
  {
    id: "film",
    label: "film & animation",
    examples: "A shot, a background, editing, lighting, title sequences.",
  },
  {
    id: "games",
    label: "games & fictional worlds",
    examples: "Environments, menus, maps and worldbuilding through objects.",
  },
  {
    id: "sound",
    label: "sound & music",
    examples:
      "Timbre, arrangements, motifs, transitions, sound design and performances.",
  },
  {
    id: "performance",
    label: "movement & performance",
    examples:
      "Choreography, poi, gestures, physical comedy and athletic technique.",
  },
  {
    id: "nature",
    label: "nature",
    examples:
      "Branching, minerals, clouds, animal movement and microscopic forms.",
  },
  {
    id: "food",
    label: "food & hospitality",
    examples:
      "Presentation, table settings, cafés and the choreography of service.",
  },
  {
    id: "ideas",
    label: "ideas & explanations",
    examples:
      "A proof, abstraction, elegant code, diagram or lucid explanation.",
  },
] as const;

export const TASTE_QUALITIES = [
  "proportion",
  "restraint",
  "rhythm",
  "legibility",
  "warmth",
  "material honesty",
  "patina",
  "mechanical elegance",
  "colour",
  "light",
  "texture",
  "precision",
  "playfulness",
  "spatial generosity",
  "continuity",
  "surprise",
];
export const TASTE_LIMITS = {
  media: 24,
  title: 180,
  observation: 280,
  content: 12000,
  notes: 12000,
  text: 6000,
  caption: 1200,
  fileBytes: 100 * 1024 * 1024,
  entryCharacters: 64000,
};

export type TasteMedia = {
  id: string;
  kind: "image" | "video" | "audio" | "embed" | "text";
  url?: string;
  storageId?: GenericId<"_storage">;
  poster?: string;
  posterStorageId?: GenericId<"_storage">;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  credit?: string;
  creditUrl?: string;
  text?: string;
  format?: "markdown" | "code" | "math";
  startSeconds?: number;
  endSeconds?: number;
  animated?: boolean;
  transcript?: string;
  captionsUrl?: string;
  captionsLanguage?: string;
};
export type TasteDraft = {
  title: string;
  url: string;
  observation: string;
  context: string;
  scope: "whole" | "detail";
  content: string;
  designNotes: string;
  categories: string[];
  qualities: string[];
  tags: string[];
  media: TasteMedia[];
  coverId: string;
  prominent: boolean;
  published: boolean;
  creator: string;
  year: string;
  sources: { id?: string; label: string; url: string }[];
};
export type TasteRecord = {
  _id: string;
  title: string;
  url: string;
  createdAt: number;
  order?: number;
  slug?: string;
  revision?: number;
  updatedAt?: number;
  screenshotUrls?: string[];
} & Partial<Omit<TasteDraft, "title" | "url">>;

export function emptyTasteDraft(): TasteDraft {
  return {
    title: "",
    url: "",
    observation: "",
    context: "",
    scope: "whole",
    content: "",
    designNotes: "",
    categories: [],
    qualities: [],
    tags: [],
    media: [],
    coverId: "",
    prominent: false,
    published: false,
    creator: "",
    year: "",
    sources: [],
  };
}
export function categoryLabel(value: string) {
  return (
    TASTE_CATEGORIES.find((category) => category.id === value)?.label ?? value
  );
}
export function tasteMedia(item: TasteRecord): TasteMedia[] {
  if (item.media !== undefined) return item.media;
  return (item.screenshotUrls ?? []).map((url, index) => ({
    id: `legacy-${index}`,
    kind: "image",
    url,
    alt: `${item.title}, image ${index + 1}`,
    width: 1600,
    height: 900,
    animated: /\.gif(?:\?|$)/i.test(url),
  }));
}
export function tasteCategories(item: TasteRecord) {
  if (item.categories !== undefined) return item.categories;
  return [
    ...new Set([
      "websites",
      ...(item.tags?.includes("shaders") ? ["shaders"] : []),
      ...(item.tags?.includes("animations") ? ["motion"] : []),
      ...(item.tags?.some((tag) =>
        ["library", "antislop software"].includes(tag),
      )
        ? ["software"]
        : []),
    ]),
  ];
}
export function toTasteDraft(item: TasteRecord): TasteDraft {
  return {
    ...emptyTasteDraft(),
    title: item.title,
    url: item.url,
    observation: item.observation ?? "",
    context: item.context ?? "",
    scope: item.scope ?? "whole",
    content: item.content ?? "",
    designNotes: item.designNotes ?? "",
    categories: tasteCategories(item),
    qualities: item.qualities ?? [],
    tags: item.tags ?? [],
    media: tasteMedia(item),
    coverId: item.coverId ?? "",
    prominent: item.prominent ?? false,
    published: item.published !== false,
    creator: item.creator ?? "",
    year: item.year ?? "",
    sources: (item.sources ?? []).map((source, index) => ({
      ...source,
      id: source.id ?? `source-${index}`,
    })),
  };
}
export function tasteCover(item: TasteRecord) {
  const media = tasteMedia(item);
  return media.find((asset) => asset.id === item.coverId) ?? media[0];
}
export function tasteKey(item: TasteRecord) {
  return item.slug || item._id;
}
export function sortTaste<T extends TasteRecord>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      (a.order ?? Infinity) - (b.order ?? Infinity) ||
      b.createdAt - a.createdAt ||
      a._id.localeCompare(b._id),
  );
}
export type TasteFilter = { q: string; category: string; quality: string };
export function filterTaste<T extends TasteRecord>(
  items: T[],
  filter: TasteFilter,
) {
  const terms = filter.q
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  return sortTaste(items).filter((item) => {
    const text = [
      item.title,
      item.observation,
      item.context,
      item.content,
      item.designNotes,
      item.creator,
      item.year,
      item.url,
      ...tasteCategories(item).map(categoryLabel),
      ...(item.qualities ?? []),
      ...(item.tags ?? []),
      ...tasteMedia(item).flatMap((asset) => [
        asset.alt,
        asset.caption,
        asset.credit,
        asset.text,
        asset.transcript,
      ]),
    ]
      .join(" ")
      .toLocaleLowerCase();
    return (
      (!filter.category || tasteCategories(item).includes(filter.category)) &&
      (!filter.quality || item.qualities?.includes(filter.quality)) &&
      terms.every((term) => text.includes(term))
    );
  });
}
export function tasteSearch(filter: TasteFilter) {
  const params = new URLSearchParams();
  if (filter.q) params.set("q", filter.q);
  if (filter.category) params.set("category", filter.category);
  if (filter.quality) params.set("quality", filter.quality);
  return params.toString();
}
export function tasteHref(item: TasteRecord, filter?: TasteFilter) {
  const query = filter ? tasteSearch(filter) : "";
  return `/taste/${encodeURIComponent(tasteKey(item))}${query ? `?${query}` : ""}`;
}
export function assetRatio(asset?: TasteMedia) {
  return asset?.width && asset.height
    ? Math.max(0.6, Math.min(2.4, asset.width / asset.height))
    : asset?.kind === "audio"
      ? 1
      : 4 / 3;
}
export function isWebUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
export function slugify(value: string) {
  return (
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80)
      .replace(/-$/g, "") || "entry"
  );
}
export function validateTaste(draft: TasteDraft): string | null {
  if (!draft.title.trim() || draft.title.length > TASTE_LIMITS.title)
    return "Use a title of 1–180 characters.";
  if (draft.url && !isWebUrl(draft.url))
    return "The source must be an http or https URL.";
  if (
    draft.observation.length > TASTE_LIMITS.observation ||
    draft.content.length > TASTE_LIMITS.content ||
    draft.designNotes.length > TASTE_LIMITS.notes
  )
    return "The observation or notes are too long.";
  if (
    [draft.context, draft.creator, draft.year].some(
      (value) => value.length > 200,
    )
  )
    return "Context, creator, and year must each be under 200 characters.";
  if (
    [draft.categories, draft.qualities, draft.tags].some(
      (values) =>
        values.length > 24 ||
        values.some((value) => !value.trim() || value.length > 60),
    )
  )
    return "Use up to 24 short categories, qualities, or keywords.";
  if (
    draft.sources.length > 10 ||
    draft.sources.some(
      (source) =>
        !source.label.trim() ||
        source.label.length > 100 ||
        !isWebUrl(source.url),
    )
  )
    return "Each additional source needs a short label and a valid URL.";
  if (
    draft.media.length > TASTE_LIMITS.media ||
    new Set(draft.media.map((asset) => asset.id)).size !== draft.media.length
  )
    return "Use up to 24 media items with distinct IDs.";
  if (draft.coverId && !draft.media.some((asset) => asset.id === draft.coverId))
    return "Choose a cover from this entry’s media.";
  for (const asset of draft.media) {
    if (!asset.id || asset.id.length > 100)
      return "A media item has an invalid ID.";
    if (asset.kind !== "text" && (!asset.url || !isWebUrl(asset.url)))
      return "Each image, recording, or example needs a valid URL.";
    if (
      asset.kind === "embed" &&
      asset.url &&
      new URL(asset.url).protocol !== "https:"
    )
      return "Interactive examples must use HTTPS.";
    if (
      asset.kind === "text" &&
      (!asset.text?.trim() || asset.text.length > TASTE_LIMITS.text)
    )
      return "Text and math items need 1–6000 characters.";
    if (
      [asset.poster, asset.creditUrl, asset.captionsUrl].some(
        (url) => url && !isWebUrl(url),
      )
    )
      return "A poster or credit URL is invalid.";
    if ((asset.transcript?.length ?? 0) > 8000)
      return "Keep transcripts under 8000 characters.";
    if (
      asset.captionsLanguage &&
      !/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(asset.captionsLanguage)
    )
      return "Use a language code such as en or ja for captions.";
    if (
      (asset.caption?.length ?? 0) > TASTE_LIMITS.caption ||
      (asset.alt?.length ?? 0) > 500 ||
      (asset.credit?.length ?? 0) > 200
    )
      return "A media caption, description, or credit is too long.";
    if (
      [asset.width, asset.height].some(
        (n) => n !== undefined && (!Number.isFinite(n) || n < 1 || n > 32000),
      )
    )
      return "Image dimensions must be between 1 and 32000 pixels.";
    if (
      [asset.startSeconds, asset.endSeconds].some(
        (n) => n !== undefined && (!Number.isFinite(n) || n < 0 || n > 86400),
      )
    )
      return "Timestamps must be between 0 and 86400 seconds.";
    if (
      asset.endSeconds !== undefined &&
      asset.endSeconds <= (asset.startSeconds ?? 0)
    )
      return "The end timestamp must follow the start.";
  }
  if (JSON.stringify(draft).length > TASTE_LIMITS.entryCharacters)
    return "This entry is too large; split it into a few related entries.";
  return null;
}

export function embedSource(value: string) {
  const url = new URL(value);
  const host = url.hostname.replace(/^www\./, "");
  if (
    host === "youtu.be" ||
    host === "youtube.com" ||
    host === "youtube-nocookie.com"
  ) {
    const id =
      host === "youtu.be"
        ? url.pathname.slice(1)
        : url.searchParams.get("v") ||
          url.pathname.split("/").filter(Boolean).pop();
    if (id && /^[\w-]{11}$/.test(id))
      return {
        url: `https://www.youtube-nocookie.com/embed/${id}?autoplay=0`,
        trusted: true,
      };
  }
  if (host === "vimeo.com" && /^\/\d+$/.test(url.pathname))
    return {
      url: `https://player.vimeo.com/video${url.pathname}`,
      trusted: true,
    };
  if (host === "codepen.io" && url.pathname.includes("/pen/"))
    return {
      url: `https://codepen.io${url.pathname.replace("/pen/", "/embed/")}?default-tab=result`,
      trusted: true,
    };
  if (host === "shadertoy.com" && /^\/view\/[\w]+$/.test(url.pathname))
    return {
      url: `https://www.shadertoy.com${url.pathname.replace("/view/", "/embed/")}?gui=true&paused=true&muted=true`,
      trusted: true,
    };
  const trusted =
    (host === "player.vimeo.com" && /^\/video\/\d+\/?$/.test(url.pathname)) ||
    (host === "codepen.io" &&
      /^\/[\w-]+\/embed\/[\w-]+\/?$/.test(url.pathname)) ||
    (host === "api.observablehq.com" && url.pathname.startsWith("/embed/")) ||
    (host === "shadertoy.com" && /^\/embed\/[\w]+$/.test(url.pathname)) ||
    (host === "sketchfab.com" &&
      /^\/models\/[a-f0-9]{32}\/embed\/?$/.test(url.pathname));
  return { url: url.href, trusted };
}
