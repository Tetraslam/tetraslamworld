// One-off content refresh for November 2026. Idempotent: rows are matched by
// their natural key (title, location, name, slug), so running it twice changes
// nothing. Run with:
//   npx convex run seeds/refresh2026:run '{"assetBase":"https://tetraslam.world"}'
// assetBase serves the committed files under public/taste-assets.
import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "../_generated/server";

type Link = { label: string; url: string };
const gh = (repo: string): Link => ({
  label: "github",
  url: `https://github.com/tetraslam/${repo}`,
});

// ---------------------------------------------------------------- images

// Remote art for new media and friends, stored in Convex like existing rows.
const REMOTE_IMAGES: Record<string, string> = {
  dandadan:
    "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171018-60q1B6GK2Ghb.jpg",
  bocchi:
    "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx130003-HTDmeL4RGeJ4.png",
  frieren:
    "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg",
  oshinoko:
    "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx150672-WqmmwZ4nMzAy.png",
  witchhat:
    "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx147105-rwOX8qyUy8gV.jpg",
  reze: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171627-ZN9D7P46yHnw.png",
  pantheon:
    "https://static.tvmaze.com/uploads/images/original_untouched/436/1091844.jpg",
  arcane:
    "https://static.tvmaze.com/uploads/images/original_untouched/536/1340287.jpg",
  hpmor: "https://upload.wikimedia.org/wikipedia/en/e/ec/HPMOR_Yudkowsky.jpg",
  katabasis:
    "https://upload.wikimedia.org/wikipedia/en/d/dd/%22Katabasis%22_R._F._Kuang_book_cover.jpg",
  arirang:
    "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/69/0a/7b/690a7bb3-4483-2418-158c-9276d7d98f81/823375049500_Cover.jpg/1000x1000bb.jpg",
  youngtape:
    "https://cdn-images.dzcdn.net/images/cover/a1436c323705764b884ad3e4c07aa480/1000x1000-000000-80-0-0.jpg",
  brilliantgreen:
    "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/13/5c/f8/135cf844-4e9f-3757-2e83-811a9b065333/4560429773191.jpg/1000x1000bb.jpg",
  whykiiikiii:
    "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/07/82/06/078206df-b63f-d1e6-4c62-d56e69949b30/885288015478.jpg/1000x1000bb.jpg",
  balladofyou:
    "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/9b/5d/9a/9b5d9a83-7854-9793-4087-72ef6fd10cdf/8721555509535.png/1000x1000bb.jpg",
  ggst: "https://cdn.cloudflare.steamstatic.com/steam/apps/1384160/library_600x900_2x.jpg",
  mindustry:
    "https://cdn.cloudflare.steamstatic.com/steam/apps/1127400/library_600x900_2x.jpg",
  hades:
    "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/library_600x900_2x.jpg",
  deadcells:
    "https://cdn.cloudflare.steamstatic.com/steam/apps/588650/library_600x900_2x.jpg",
  diesirae: "https://t.vndb.org/cv/16/79716.jpg",
  katawa: "https://t.vndb.org/cv/88/88188.jpg",
  "friend:dunya": "https://avatars.githubusercontent.com/u/53619378?v=4",
  "friend:michael": "https://avatars.githubusercontent.com/u/200992958?v=4",
  "friend:rohan": "https://rsap.sh/static/me.jpg",
  "friend:finn": "https://finnfreas.com/finn-photo.jpg",
};

// Committed under public/, fetched from the deployed site.
const SITE_IMAGES: Record<string, string> = {
  "nerv:signin": "/taste-assets/nerv-signin.webp",
  "nerv:wake": "/taste-assets/nerv-missed-wake.webp",
  "nerv:standby": "/taste-assets/nerv-standby.webp",
};

// ---------------------------------------------------------------- content

type WorkRow = Omit<Doc<"work">, "_id" | "_creationTime">;
const NEW_WORK: WorkRow[] = [
  { type: "job", title: "mts @ aire", date: "april 2026", endDate: "present" },
  {
    type: "project",
    title: "kiseki",
    content:
      "an open-source react component for reading agent traces. a 10,000-step trace paints in 75 ms.",
    links: [{ label: "kiseki.sh", url: "https://kiseki.sh" }, gh("kiseki")],
    tags: ["react", "typescript", "agents"],
    imageUrl: "/work/kiseki.webp",
    featured: true,
  },
  {
    type: "project",
    title: "lispium",
    content:
      "a symbolic computer algebra system in pure zig with zero dependencies. it ships with a webassembly playground, an lsp, a jupyter kernel, and 558 tests.",
    links: [
      {
        label: "playground",
        url: "https://tetraslam.github.io/lispium/playground/",
      },
      gh("lispium"),
    ],
    tags: ["zig", "cas", "wasm"],
    imageUrl: "/work/lispium.webp",
    featured: true,
  },
  {
    type: "project",
    title: "computah",
    content:
      "an improvements box for your app: type a change, and a coding agent you already have makes it.",
    links: [
      { label: "computah.sh", url: "https://computah.sh" },
      gh("computah"),
    ],
    tags: ["react", "agents"],
    imageUrl: "/work/computah.gif",
    featured: true,
  },
  {
    type: "project",
    title: "omavn",
    content:
      "play visual novels on linux. point it at whatever you downloaded and it figures out the rest.",
    links: [{ label: "omavn.dev", url: "https://omavn.dev" }, gh("omavn")],
    tags: ["rust", "linux"],
    imageUrl: "/work/omavn.webp",
    featured: true,
  },
  {
    type: "project",
    title: "steering gemma",
    content:
      "a cockpit for steering gemma 4 31b: train persona directions in the residual stream, then turn them up and down live while it talks.",
    links: [gh("steering-gemma")],
    tags: ["interpretability", "modal", "python"],
    imageUrl: "/work/steering-gemma.gif",
    featured: true,
  },
  {
    type: "project",
    title: "griddy",
    content:
      "1st place, sustainability track @ hackmit 2025. a power grid routed with mixed-integer linear programming on esp32s, running on iron-air batteries we made from fertilizer during the hackathon.",
    links: [{ label: "writeup", url: "https://tetraslam.world/blog/q4_2025" }],
    tags: ["hardware", "esp32", "optimization"],
  },
  {
    type: "project",
    title: "tetrachromatic",
    content:
      "game boy color games for the modretro chromatic. more on the way.",
    links: [gh("tetrachromatic")],
    tags: ["game boy", "c"],
  },
  {
    type: "project",
    title: "omarchy plugins",
    content:
      "small things for my desktop: alt-tab with live thumbnails, a pixel fox that lives in the bar, a weekly wrapped, my anime queue, one-key capture to obsidian, and more.",
    links: [
      { label: "alttab", url: "https://github.com/tetraslam/omarchy-alttab" },
      {
        label: "familiar",
        url: "https://github.com/tetraslam/omarchy-familiar",
      },
      { label: "wrapped", url: "https://github.com/tetraslam/omarchy-wrapped" },
      { label: "mal", url: "https://github.com/tetraslam/omarchy-mal" },
    ],
    tags: ["linux", "qml"],
  },
  {
    type: "project",
    title: "playground",
    content:
      "a monorepo of toys: a sat solver, persistent homology from scratch, a formant synth, a dyson shell in blender, and two dozen more.",
    links: [gh("playground")],
  },
  {
    type: "project",
    title: "tetrastack",
    content:
      "the libraries, references, and rejections behind everything i build for the web, written for agents.",
    links: [{ label: "taste", url: "/taste" }, gh("tetrastack")],
  },
  {
    type: "project",
    title: "tetrapod",
    content: "my always-on aws box and the infrastructure code behind it.",
    links: [gh("tetrapod")],
  },
  {
    type: "project",
    title: "tetracover",
    content:
      "an agent skill for repo front pages: readmes, badges, and demo recordings that tell the truth.",
    links: [gh("tetracover")],
  },
  {
    type: "project",
    title: "dotagents",
    content: "portable opencode agents, mcps, and helix defaults.",
    links: [gh("dotagents")],
  },
  {
    type: "other",
    title: "softmax house",
    content: "the hacker house i run in san francisco.",
    links: [{ label: "softmax.house", url: "https://softmax.house" }],
  },
  {
    type: "other",
    title: "judge @ paris research hackathon",
    content: "tum.ai × inria × max planck, paris. june 2026.",
    date: "jun 2026",
  },
  {
    type: "other",
    title: "judge @ the computer use hackathon",
    content: "h company × nvidia × accel, san francisco. july 2026.",
    date: "jul 2026",
  },
];

// Display order after the refresh. Titles missing here keep their order.
const WORK_ORDER: Record<string, number> = {
  "mts @ aire": 0,
  "eng intern @ natural.co": 1,
  "ml researcher @ mit media lab": 2,
  "founding engineer @ mosaic (yc w25)": 3,
  kiseki: 0,
  lispium: 1,
  computah: 2,
  omavn: 3,
  "steering gemma": 4,
  "re:zero": 5,
  shfla: 6,
  "pocket realms! :d": 7,
  griddy: 8,
  tetrachromatic: 9,
  "omarchy plugins": 10,
  playground: 11,
  tetrastack: 12,
  tetrapod: 13,
  tetracover: 14,
  dotagents: 15,
  robocup: 16,
  "kpop dance formation generator": 17,
  "onemonth.dev": 18,
  manimtired: 19,
  roami: 20,
  "perry the platypus!?": 21,
  "algorithmically generating glyphs": 22,
  paperchase: 23,
  prosperousss: 24,
  fiberfinder: 25,
  "softmax house": 0,
  tetracorp: 1,
  "judge @ paris research hackathon": 2,
  "judge @ the computer use hackathon": 3,
};
const FEATURED = new Set([
  "kiseki",
  "lispium",
  "computah",
  "omavn",
  "steering gemma",
  "re:zero",
  "shfla",
  "pocket realms! :d",
]);

type MediaRow = {
  type: Doc<"media">["type"];
  title: string;
  image?: string;
  content?: string;
  tags?: string[];
};
const NEW_MEDIA: MediaRow[] = [
  { type: "anime", title: "dandadan", image: "dandadan" },
  { type: "anime", title: "bocchi the rock!", image: "bocchi" },
  { type: "anime", title: "frieren", image: "frieren" },
  { type: "anime", title: "oshi no ko", image: "oshinoko" },
  { type: "anime", title: "witch hat atelier", image: "witchhat" },
  { type: "movie", title: "chainsaw man: reze arc", image: "reze" },
  { type: "show", title: "pantheon", image: "pantheon" },
  { type: "show", title: "arcane", image: "arcane" },
  {
    type: "book",
    title: "harry potter and the methods of rationality",
    image: "hpmor",
  },
  { type: "book", title: "katabasis", image: "katabasis" },
  { type: "music", title: "BTS - ARIRANG", image: "arirang" },
  { type: "music", title: "YOUNG POSSE - YOUNG TAPE", image: "youngtape" },
  {
    type: "music",
    title: "the brilliant green - the brilliant green",
    image: "brilliantgreen",
  },
  { type: "music", title: "KiiiKiii - WhyKiiiKiii", image: "whykiiikiii" },
  { type: "music", title: "Silica Gel - Ballad of You", image: "balladofyou" },
  { type: "game", title: "guilty gear strive", image: "ggst" },
  { type: "game", title: "mindustry", image: "mindustry" },
  { type: "game", title: "hades", image: "hades" },
  { type: "game", title: "dead cells", image: "deadcells" },
  {
    type: "game",
    title: "dies irae",
    image: "diesirae",
    tags: ["visual novel"],
  },
  {
    type: "game",
    title: "katawa shoujo",
    image: "katawa",
    tags: ["visual novel"],
  },
  { type: "concert", title: "twice", content: "oakland, january 2026." },
  { type: "concert", title: "bts", content: "las vegas, may 2026." },
  { type: "concert", title: "ado", content: "oakland." },
  { type: "concert", title: "bigbang", content: "oakland." },
  { type: "concert", title: "yoasobi", content: "oakland." },
];

type TravelRow = {
  location: string;
  lat: number;
  lng: number;
  start?: string;
  content: string;
};
const NEW_TRAVEL: TravelRow[] = [
  {
    location: "chantilly",
    lat: 49.194,
    lng: 2.4711,
    start: "2026",
    content: "a week here in june 2026 for the aire offsite.",
  },
  {
    location: "mountain view",
    lat: 37.3861,
    lng: -122.0839,
    start: "2026",
    content: "",
  },
  {
    location: "muir woods",
    lat: 37.897,
    lng: -122.5811,
    start: "2026",
    content: "",
  },
  {
    location: "stinson beach",
    lat: 37.9005,
    lng: -122.6444,
    start: "2026",
    content: "",
  },
  {
    location: "sausalito",
    lat: 37.8591,
    lng: -122.4853,
    start: "2026",
    content: "",
  },
  {
    location: "white mountains",
    lat: 44.27,
    lng: -71.3033,
    start: "2026",
    content: "went with friends in september 2026.",
  },
  {
    location: "woodstock, maine",
    lat: 44.3895,
    lng: -70.6081,
    start: "2026",
    content:
      "a trip with the rev crew in fall 2026. most of the white mountains group came too.",
  },
];
const TRAVEL_APPEND: Record<string, string> = {
  paris:
    "back in june 2026: two days in paris, a week in chantilly with aire, then a second week in paris.",
  boston: "back for fall 2026 while i waited on my o-1.",
};

type FriendRow = {
  name: string;
  content: string;
  links: Link[];
  image?: string;
};
const NEW_FRIENDS: FriendRow[] = [
  {
    name: "dünya baradari",
    content:
      "researcher @ mit media lab (fluid interfaces)\n- my decision twins collaborator\n- co-founder of augmentation lab",
    links: [
      { label: "website", url: "https://www.dunya-baradari.com/" },
      { label: "github", url: "https://github.com/Dunya-8a" },
      {
        label: "linkedin",
        url: "https://www.linkedin.com/in/dunya-baradari-007",
      },
    ],
    image: "friend:dunya",
  },
  {
    name: "michael hui",
    content:
      "cs & math @ northeastern\n- rev cohort 6\n- writes physics and gpu kernels for long-horizon agent inference",
    links: [
      { label: "github", url: "https://github.com/mmfhui" },
      { label: "linkedin", url: "https://www.linkedin.com/in/hui-michael" },
    ],
    image: "friend:michael",
  },
  {
    name: "rohan verma",
    content:
      "computer engineering & cs @ northeastern\n- rev cohort 6, and one of the kaeli kids (nucar)\n- building a container platform for homelabs, and a robodog for rev",
    links: [
      { label: "website", url: "https://rsap.sh/" },
      { label: "sourcehut", url: "https://sr.ht/~verma" },
      { label: "linkedin", url: "https://www.linkedin.com/in/rsap-sh" },
    ],
    image: "friend:rohan",
  },
  {
    name: "jake pham",
    content:
      "ce & cs @ northeastern\n- rev cohort 6, and one of the kaeli kids (nucar)\n- building a robodog for rev",
    links: [
      { label: "website", url: "https://jaken.dev/" },
      { label: "linkedin", url: "https://www.linkedin.com/in/jakeph" },
    ],
  },
  {
    name: "finn freas",
    content:
      "honors ece @ northeastern\n- rev cohort 6\n- loves fpgas, and is building a robodog for rev",
    links: [
      { label: "website", url: "https://finnfreas.com/" },
      { label: "github", url: "https://github.com/finn-freas" },
      {
        label: "linkedin",
        url: "https://www.linkedin.com/in/finn-freas-a7445036b",
      },
    ],
    image: "friend:finn",
  },
];

const NERV_SLUG = "nerv-console";

// ---------------------------------------------------------------- functions

export const missingImages = internalQuery({
  args: {},
  handler: async (ctx) => {
    const media = await ctx.db.query("media").collect();
    const friends = await ctx.db.query("friends").collect();
    const nerv = await ctx.db
      .query("taste")
      .withIndex("by_slug", (q) => q.eq("slug", NERV_SLUG))
      .unique();
    const keys = [
      ...NEW_MEDIA.filter(
        (row) => row.image && !media.some((m) => m.title === row.title),
      ).map((row) => row.image as string),
      ...NEW_FRIENDS.filter(
        (row) => row.image && !friends.some((f) => f.name === row.name),
      ).map((row) => row.image as string),
      ...(nerv ? [] : Object.keys(SITE_IMAGES)),
    ];
    return keys;
  },
});

export const run = internalAction({
  args: { assetBase: v.string() },
  handler: async (ctx, args) => {
    const keys: string[] = await ctx.runQuery(
      internal.seeds.refresh2026.missingImages,
      {},
    );
    const images: Record<string, { url: string; storageId: string }> = {};
    const failed: string[] = [];
    for (const key of keys) {
      const source =
        REMOTE_IMAGES[key] ??
        (SITE_IMAGES[key] && new URL(SITE_IMAGES[key], args.assetBase).href);
      if (!source) continue;
      try {
        const response = await fetch(source, {
          headers: { "User-Agent": "Mozilla/5.0 (tetraslam.world refresh)" },
        });
        if (!response.ok) throw new Error(String(response.status));
        const blob = await response.blob();
        if (!blob.type.startsWith("image/")) throw new Error(blob.type);
        const storageId = await ctx.storage.store(blob);
        const url = await ctx.storage.getUrl(storageId);
        if (url) images[key] = { url, storageId };
      } catch (error) {
        failed.push(`${key}: ${String(error)}`);
      }
    }
    const summary: string[] = await ctx.runMutation(
      internal.seeds.refresh2026.apply,
      { images },
    );
    return { failed, summary };
  },
});

export const apply = internalMutation({
  args: {
    images: v.record(
      v.string(),
      v.object({ url: v.string(), storageId: v.string() }),
    ),
  },
  handler: async (ctx, { images }) => {
    const log: string[] = [];

    // work
    const work = await ctx.db.query("work").collect();
    const byTitle = (title: string) =>
      work.find((row) => row.title.toLowerCase() === title.toLowerCase());
    for (const row of NEW_WORK) {
      if (byTitle(row.title)) continue;
      await ctx.db.insert("work", row);
      log.push(`work + ${row.title}`);
    }
    const sapientia = byTitle("sapientia research");
    if (sapientia) {
      await ctx.db.delete(sapientia._id);
      log.push("work - sapientia research");
    }
    const media = byTitle("ml researcher @ mit media lab");
    if (media && media.endDate === "present") {
      await ctx.db.patch(media._id, { endDate: "aug 2026" });
      log.push("work ~ mit media lab ended");
    }
    const onemonth = byTitle("onemonth.dev");
    if (onemonth?.content?.includes("nov 2025 update")) {
      await ctx.db.patch(onemonth._id, {
        content:
          "learn anything in 30 days. grew to $2.7k mrr; no longer running.",
      });
      log.push("work ~ onemonth.dev");
    }
    const shfla = byTitle("shfla");
    if (shfla && !shfla.links?.some((l) => l.url.includes("vercel.app"))) {
      await ctx.db.patch(shfla._id, {
        links: [
          { label: "play it in your browser", url: "https://shfla.vercel.app" },
          ...(shfla.links ?? []),
        ],
      });
      log.push("work ~ shfla live link");
    }
    for (const row of await ctx.db.query("work").collect()) {
      const key = row.title.toLowerCase();
      const order = WORK_ORDER[key];
      const featured = row.type === "project" && FEATURED.has(key);
      const patch: Partial<Doc<"work">> = {};
      if (order !== undefined && row.order !== order) patch.order = order;
      if (row.type === "project" && !!row.featured !== featured)
        patch.featured = featured || undefined;
      if (Object.keys(patch).length) await ctx.db.patch(row._id, patch);
    }

    // media
    const existingMedia = await ctx.db.query("media").collect();
    const nextOrder: Record<string, number> = {};
    for (const row of existingMedia)
      nextOrder[row.type] = Math.max(
        nextOrder[row.type] ?? -1,
        row.order ?? -1,
      );
    for (const row of NEW_MEDIA) {
      if (existingMedia.some((m) => m.title === row.title)) continue;
      const image = row.image ? images[row.image]?.url : undefined;
      nextOrder[row.type] = (nextOrder[row.type] ?? -1) + 1;
      await ctx.db.insert("media", {
        type: row.type,
        title: row.title,
        content: row.content,
        tags: row.tags,
        imageUrls: image ? [image] : undefined,
        order: nextOrder[row.type],
      });
      log.push(`media + ${row.type} ${row.title}${image ? "" : " (no image)"}`);
    }

    // travel
    const travel = await ctx.db.query("travel").collect();
    let travelOrder = Math.max(...travel.map((row) => row.order ?? 0));
    for (const row of NEW_TRAVEL) {
      if (travel.some((t) => t.location === row.location)) continue;
      travelOrder += 1;
      await ctx.db.insert("travel", {
        location: row.location,
        coordinates: { lat: row.lat, lng: row.lng },
        dates: row.start ? { start: row.start } : undefined,
        content: row.content || undefined,
        order: travelOrder,
      });
      log.push(`travel + ${row.location}`);
    }
    for (const [location, addition] of Object.entries(TRAVEL_APPEND)) {
      const row = travel.find((t) => t.location === location);
      if (!row || row.content?.includes(addition)) continue;
      await ctx.db.patch(row._id, {
        content: `${(row.content ?? "").trimEnd()}\n\n${addition}`,
      });
      log.push(`travel ~ ${location}`);
    }

    // friends
    const friends = await ctx.db.query("friends").collect();
    let friendOrder = Math.max(...friends.map((row) => row.order ?? 0));
    for (const row of NEW_FRIENDS) {
      if (friends.some((f) => f.name === row.name)) continue;
      friendOrder += 1;
      await ctx.db.insert("friends", {
        name: row.name,
        content: row.content,
        links: row.links,
        imageUrl: row.image ? images[row.image]?.url : undefined,
        order: friendOrder,
      });
      log.push(`friends + ${row.name}`);
    }

    // taste: the nerv console
    const nerv = await ctx.db
      .query("taste")
      .withIndex("by_slug", (q) => q.eq("slug", NERV_SLUG))
      .unique();
    if (!nerv && images["nerv:signin"]) {
      const taste = await ctx.db.query("taste").collect();
      const first = Math.min(0, ...taste.map((row) => row.order ?? 0));
      const asset = (
        key: string,
        id: string,
        alt: string,
        width: number,
        height: number,
      ) => ({
        id,
        kind: "image" as const,
        url: images[key].url,
        storageId: images[key].storageId as Id<"_storage">,
        width,
        height,
        alt,
        credit: "tetraslam",
      });
      const media = [
        asset(
          "nerv:wake",
          "cover",
          "an orange-and-red alarm panel: 未起動, a seven-segment overdue timer, and a full-width MISSED WAKE band",
          691,
          490,
        ),
        asset(
          "nerv:standby",
          "standby",
          "the same panel at rest: 待機 in heavy mincho beside a seven-segment countdown to the next pass",
          691,
          290,
        ),
        asset(
          "nerv:signin",
          "signin",
          "the console's sign-in screen: 認証 set huge in orange mincho on black, cropped by the edge of the screen",
          1440,
          900,
        ),
      ].filter((item) => item.url);
      await ctx.db.insert("taste", {
        slug: NERV_SLUG,
        title: "nerv console",
        url: "https://nerv-console.vercel.app",
        observation:
          "a monitor for an autonomous agent i run, built from evangelion's actual control-room frames",
        context:
          "my own work. the console and its omarchy bar widget are private; these are fixture states.",
        scope: "whole",
        content:
          "the console and bar panel for one of my long-running agents, designed in the evangelion / nerv direction from [tetrastack](https://github.com/tetraslam/tetrastack).",
        designNotes:
          "- studied from frames (episode 2 emergency displays, the MAGI, jet alone's control room) and the real nerv disaster prevention app, not from what the style looks like in general\n- calm by default: orange on black, compact telemetry. red and the full-width band only take over when the agent actually needs me (a missed wake), so the alarm means something\n- a heavy mincho for the state (待機 standby, 未起動 not started), condensed caps for labels, seven-segment digits for time\n- no hexagons, hazard stripes, scanlines, or decorative numbers",
        categories: ["software", "websites"],
        qualities: ["colour", "legibility", "precision"],
        tags: [],
        media,
        coverId: "cover",
        prominent: false,
        published: true,
        creator: "tetraslam",
        year: "2026",
        sources: [
          {
            id: "s1",
            label: "evangelion / nerv direction in tetrastack",
            url: "https://github.com/tetraslam/tetrastack/blob/main/directions/evangelion-nerv.md",
          },
        ],
        screenshotUrls: media.map((item) => item.url),
        order: first - 1,
        revision: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      log.push("taste + nerv console");
    }

    return log;
  },
});

const NOW_NOTE =
  "back in sf after a fall in boston, and the o-1a came through in october. days at aire; nights on [kiseki](https://kiseki.sh), [computah](https://computah.sh), and game boy games for the modretro chromatic.";

export const home = internalMutation({
  args: {},
  handler: async (ctx) => {
    const doc = await ctx.db
      .query("siteContent")
      .withIndex("by_key", (q) => q.eq("key", "home"))
      .unique();
    if (!doc) return "no home copy saved; the default copy already names aire";
    const body = doc.body.replace(
      "at a stealth neolab",
      "at [aire](https://aire.ai)",
    );
    const patch: Partial<Doc<"siteContent">> = {};
    if (body !== doc.body) patch.body = body;
    if (!doc.now) {
      patch.now = NOW_NOTE;
      patch.nowUpdatedAt = Date.now();
    }
    if (!Object.keys(patch).length) return "unchanged";
    await ctx.db.patch(doc._id, {
      ...patch,
      revision: doc.revision + 1,
      updatedAt: Date.now(),
    });
    return Object.keys(patch).join(", ");
  },
});

// Friends added by the first run and later taken back off the page.
const REMOVED_FRIENDS = ["alex rochette", "maya ahmed"];

export const removeFriends = internalMutation({
  args: {},
  handler: async (ctx) => {
    const removed: string[] = [];
    for (const friend of await ctx.db.query("friends").collect()) {
      if (!REMOVED_FRIENDS.includes(friend.name)) continue;
      await ctx.db.delete(friend._id);
      removed.push(friend.name);
    }
    return removed;
  },
});
