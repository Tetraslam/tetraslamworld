import { gzipSync } from "node:zlib";
import { describe, expect, test } from "vitest";
import {
  imageSize,
  isPrivateHost,
  pageImage,
  planPreview,
} from "../shared/previews";
import { untar } from "../shared/tar";
import type { TasteRecord } from "../shared/taste";
import {
  entryPicture,
  findEntry,
  indexEntries,
  join,
  sourcesNeedingPreviews,
  unreferenced,
} from "../shared/taste-book";
import {
  bullets,
  entryKeyFromUrl,
  parseDirection,
  parseStackLayer,
  parseTaste,
  parseTetrastack,
  previewCandidates,
  prose,
  resolveHref,
  splitList,
  type TetrastackFiles,
} from "../shared/tetrastack";
import snapshot from "../src/lib/tetrastack/snapshot.json";

const TASTE = `# taste

references for calibration, not templates.

the full collection lives at [tetraslam.world/taste](https://tetraslam.world/taste).

## constants

these hold in every project.

- **hierarchy before decoration.** decide what the reader needs first.
- **nothing shifts, nothing is lost.** see [perf](perf.md).

## directions

every direction has a file in [directions/](directions/).

- **warm paper** (parc): warm off-white surfaces. fits notes.
- **neobrutalism** ([neobrutalism.dev](https://neobrutalism.dev)): flat saturated color.
- **swiss / international typographic**: a rigorous grid.

### attractors

agents fall into these looks.

- **stock shadcn**: neutral gray, default everything.

## the bar

three elements from my own work.

### the upload field · delve-onsite
the drop zone is a live shader. [source](https://github.com/tetraslam/delve-onsite)

### the field · parc
the same idea grown into a material.
- it pauses offscreen.
- reduced motion holds still.

## sites

### [palladium magazine](https://www.palladiummag.com/) · [entry](https://tetraslam.world/taste/kh784)
- hope, grandeur, and restraint.

### [prime intellect](https://www.primeintellect.ai/model-factory) · [inference](https://www.primeintellect.ai/inference)
the product pages, not the homepage.
- **signature**: corner tick marks.

### persona 5 (game ui)
- red, black, and white only.

## libraries that are also taste

- [torph](https://torph.lochie.me/) ([entry](https://tetraslam.world/taste/kh76)): the right way to morph text.
- [vgpu](https://vgpu.sh/), [nuqs](https://nuqs.dev/): small tools that do one job.
`;

const DIRECTION = `---
direction: ukiyo-e / woodblock
status: draft
---

# ukiyo-e / woodblock

flat color planes, bold outlines. fits storytelling.

## sources
- [The Met’s Hokusai *Under the Wave*, ca. 1830](https://www.metmuseum.org/art/collection/search/45434): Use a few strongly separated color masses.
- [the composer in "the bar"](../taste.md#the-bar): the level of care.

## learned in practice
- kiri: the same view printed as weather states.

## on the web
none at the bar yet.

## avoid
A Great Wave background.
`;

const STACK = `# motion

animation, shaders, and generative texture.

### [torph](https://torph.lochie.me)
dependency-free text morphing.
- **shipped in**: parc, tetravoice, rev-website

### [fontsource](https://fontsource.org)
self-hosted fonts.
- **watch out**: subset them.
- **shipped in**: parc and tetravoice use the older set (inter, newsreader, jetbrains mono)

## to build

### ink reveal
paint bleeding in.
- **mechanism**: a mask that thresholds noise.

## contextual

- [three](https://threejs.org): 3d.
`;

describe("taste.md", () => {
  const doc = parseTaste(TASTE);

  test("intro, constants, and their leads", () => {
    expect(doc.intro[0]).toBe("references for calibration, not templates.");
    expect(doc.constants.intro).toEqual(["these hold in every project."]);
    expect(doc.constants.items.map((c) => c.lead)).toEqual([
      "hierarchy before decoration",
      "nothing shifts, nothing is lost",
    ]);
    expect(doc.constants.items[1].body).toBe("see [perf](perf.md).");
  });

  test("direction list, with examples that contain links", () => {
    expect(doc.directions.items).toEqual([
      {
        name: "warm paper",
        slug: "warm-paper",
        example: "parc",
        summary: "warm off-white surfaces. fits notes.",
      },
      {
        name: "neobrutalism",
        slug: "neobrutalism",
        example: "[neobrutalism.dev](https://neobrutalism.dev)",
        summary: "flat saturated color.",
      },
      {
        name: "swiss / international typographic",
        slug: "swiss-international-typographic",
        example: undefined,
        summary: "a rigorous grid.",
      },
    ]);
    expect(doc.directions.attractors?.items[0].lead).toBe("stock shadcn");
  });

  test("the bar keeps prose and list apart", () => {
    const field = doc.bar?.items[1];
    expect(field?.title).toBe("the field");
    expect(field?.intro).toEqual(["the same idea grown into a material."]);
    expect(field?.notes.map((n) => n.markdown)).toEqual([
      "it pauses offscreen.",
      "reduced motion holds still.",
    ]);
  });

  test("references join headings, entries, and extra links", () => {
    const [sites, libraries] = doc.groups;
    expect(sites.title).toBe("sites");
    const [palladium, prime, persona] = sites.references;
    expect(palladium).toMatchObject({
      title: "palladium magazine",
      url: "https://www.palladiummag.com/",
      entryKey: "kh784",
    });
    expect(prime.links).toEqual([
      { label: "inference", url: "https://www.primeintellect.ai/inference" },
    ]);
    expect(prime.intro).toEqual(["the product pages, not the homepage."]);
    expect(prime.notes[0].lead).toBe("signature");
    expect(persona).toMatchObject({
      title: "persona 5 (game ui)",
      url: undefined,
    });

    const [torph, small] = libraries.references;
    expect(torph).toMatchObject({
      title: "torph",
      url: "https://torph.lochie.me/",
      entryKey: "kh76",
      body: "the right way to morph text.",
    });
    expect(small.url).toBeUndefined();
    expect(small.links.map((l) => l.label)).toEqual(["vgpu", "nuqs"]);
  });
});

describe("directions", () => {
  test("frontmatter, sources, and parts", () => {
    const d = parseDirection("ukiyo-e-woodblock", DIRECTION);
    expect(d.name).toBe("ukiyo-e / woodblock");
    expect(d.status).toBe("draft");
    expect(d.summary).toBe(
      "flat color planes, bold outlines. fits storytelling.",
    );
    expect(d.parts.map((p) => p.title)).toEqual([
      "sources",
      "learned in practice",
      "on the web",
      "avoid",
    ]);
    const [met, bar] = d.parts[0].links;
    expect(met.label).toBe("The Met’s Hokusai Under the Wave, ca. 1830");
    expect(met.note).toBe("Use a few strongly separated color masses.");
    expect(bar.url).toBe("/taste#the-bar");
    // Only web links can have previews.
    expect(d.sources.map((s) => s.url)).toEqual([
      "https://www.metmuseum.org/art/collection/search/45434",
    ]);
    expect(d.parts[1].notes).toEqual([
      "kiri: the same view printed as weather states.",
    ]);
    expect(d.parts[2].prose).toEqual(["none at the bar yet."]);
    expect(d.parts[3].prose).toEqual(["A Great Wave background."]);
  });

  test("missing frontmatter falls back to the heading and draft", () => {
    const d = parseDirection("x", "# a new look\n\nsomething.\n");
    expect(d).toMatchObject({
      name: "a new look",
      status: "draft",
      summary: "something.",
    });
  });
});

describe("stack", () => {
  test("libraries, notes, shipped in, and later groups", () => {
    const layer = parseStackLayer("motion", STACK);
    expect(layer.title).toBe("motion");
    expect(layer.intro).toEqual([
      "animation, shaders, and generative texture.",
    ]);
    const [picks, build, contextual] = layer.groups;
    expect(picks.libraries.map((l) => l.name)).toEqual(["torph", "fontsource"]);
    expect(picks.libraries[0]).toMatchObject({
      url: "https://torph.lochie.me",
      shippedIn: ["parc", "tetravoice", "rev-website"],
      description: ["dependency-free text morphing."],
    });
    // A sentence isn't a list of projects.
    expect(picks.libraries[1].shippedIn).toEqual([]);
    expect(picks.libraries[1].notes.map((n) => n.label)).toEqual([
      "watch out",
      "shipped in",
    ]);
    expect(build.title).toBe("to build");
    expect(build.libraries[0].notes[0].label).toBe("mechanism");
    expect(contextual.items[0].links[0].url).toBe("https://threejs.org");
  });

  test("splitList respects parentheses", () => {
    expect(splitList("a, b (c, d), e")).toEqual(["a", "b (c, d)", "e"]);
  });
});

describe("links", () => {
  test("relative links go to their home on the site or on github", () => {
    expect(resolveHref("perf.md", "taste.md")).toBe(
      "https://github.com/Tetraslam/tetrastack/blob/main/perf.md",
    );
    expect(resolveHref("../taste.md#the-bar", "directions/x.md")).toBe(
      "/taste#the-bar",
    );
    expect(resolveHref("directions/", "taste.md")).toBe("/taste#directions");
    expect(resolveHref("lens.md", "directions/x.md")).toBe(
      "/taste/directions/lens",
    );
    expect(resolveHref("stack/motion.md#to-build", "taste.md")).toBe(
      "/taste#motion-to-build",
    );
    expect(resolveHref("README.md#the-stack", "rejected.md")).toBe(
      "/taste#stack",
    );
    expect(resolveHref("voices/discord.md", "voice.md")).toBe(
      "https://github.com/Tetraslam/tetrastack/blob/main/voices/discord.md",
    );
    expect(resolveHref("https://tetraslam.world/taste/abc", "taste.md")).toBe(
      "/taste/abc",
    );
    expect(resolveHref("https://example.com/a", "taste.md")).toBe(
      "https://example.com/a",
    );
  });

  test("entry keys", () => {
    expect(
      entryKeyFromUrl("https://tetraslam.world/taste/oil-paint-brush"),
    ).toBe("oil-paint-brush");
    expect(entryKeyFromUrl("/taste/kh7")).toBe("kh7");
    expect(entryKeyFromUrl("/taste/directions/lens")).toBeNull();
    expect(entryKeyFromUrl("https://tetraslam.world/taste")).toBeNull();
    expect(entryKeyFromUrl("https://example.com/taste/x")).toBeNull();
  });

  test("prose stops where a list starts", () => {
    expect(prose("one\n- a\n\ntwo\n\n| x |")).toEqual(["one", "two"]);
    expect(bullets("text\n- a\n  more\n- b").map((b) => b.markdown)).toEqual([
      "a\nmore",
      "b",
    ]);
  });
});

describe("the whole repository", () => {
  const stack = parseTetrastack(snapshot as TetrastackFiles);

  test("the vendored snapshot parses into every section", () => {
    expect(stack.taste.constants.items.length).toBeGreaterThan(5);
    expect(stack.directions.length).toBeGreaterThan(20);
    expect(stack.stack.map((l) => l.slug).slice(0, 2)).toEqual([
      "app",
      "backend",
    ]);
    expect(stack.rejected.tables.map((t) => t.title)).toContain("never");
    expect(stack.taste.bar?.items).toHaveLength(3);
    for (const direction of stack.directions) {
      expect(direction.name).toBeTruthy();
      expect(direction.parts.length).toBeGreaterThan(0);
    }
  });

  test("taste.md's order leads; new direction files still appear", () => {
    const files = {
      ...(snapshot as TetrastackFiles).files,
      "directions/zz-new.md":
        "---\ndirection: zz new\nstatus: approved\n---\n# zz new\n\nfresh.\n",
    };
    const withNew = parseTetrastack({
      ...(snapshot as TetrastackFiles),
      files,
    });
    expect(withNew.directions[0].slug).toBe(stack.directions[0].slug);
    expect(withNew.directions.at(-1)).toMatchObject({
      slug: "zz-new",
      status: "approved",
    });
  });

  test("preview candidates are web links only", () => {
    const urls = previewCandidates(stack);
    expect(urls.length).toBeGreaterThan(50);
    expect(urls.every((url) => /^https?:\/\//.test(url))).toBe(true);
  });
});

describe("tar", () => {
  function header(
    name: string,
    size: number,
    type: string,
    mtime = 1700000000,
  ) {
    const block = new Uint8Array(512);
    const write = (value: string, offset: number) =>
      block.set(new TextEncoder().encode(value), offset);
    write(name, 0);
    write(`${size.toString(8).padStart(11, "0")}\0`, 124);
    write(`${mtime.toString(8).padStart(11, "0")}\0`, 136);
    write(type, 156);
    write("ustar", 257);
    return block;
  }
  function pad(data: Uint8Array) {
    const out = new Uint8Array(Math.ceil(data.length / 512) * 512);
    out.set(data);
    return out;
  }
  test("reads files, the commit, and strips the top directory", () => {
    const record = "52 comment=40788c6bb05ca080c85a44568beda4ec79486553\n";
    const body = new TextEncoder().encode("# taste\n");
    const parts = [
      header("pax_global_header", record.length, "g"),
      pad(new TextEncoder().encode(record)),
      header("Tetraslam-tetrastack-40788c6/", 0, "5"),
      header("Tetraslam-tetrastack-40788c6/taste.md", body.length, "0"),
      pad(body),
      new Uint8Array(1024),
    ];
    const archive = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let offset = 0;
    for (const part of parts) {
      archive.set(part, offset);
      offset += part.length;
    }
    // Round-trips through gzip the way codeload serves it.
    expect(gzipSync(archive).length).toBeGreaterThan(0);
    const result = untar(archive);
    expect(result.commit).toBe("40788c6bb05ca080c85a44568beda4ec79486553");
    expect(Object.keys(result.files)).toEqual(["taste.md"]);
    expect(new TextDecoder().decode(result.files["taste.md"])).toBe(
      "# taste\n",
    );
    expect(result.mtime).toBe(1700000000 * 1000);
  });
});

describe("previews", () => {
  test("museum links use their APIs", () => {
    expect(
      planPreview("https://www.metmuseum.org/art/collection/search/45434"),
    ).toEqual({
      kind: "met",
      id: "45434",
    });
    expect(planPreview("https://www.artic.edu/artworks/10926")).toEqual({
      kind: "artic",
      id: "10926",
    });
    expect(planPreview("https://example.com")).toEqual({ kind: "page" });
  });

  test("og:image, relative and entity-encoded", () => {
    expect(
      pageImage(
        `<head><meta content="/a.png?x=1&amp;y=2" property="og:image"><meta property="og:site_name" content="Site"></head>`,
        "https://example.com/page",
      ),
    ).toMatchObject({
      image: "https://example.com/a.png?x=1&y=2",
      site: "Site",
    });
    expect(
      pageImage(
        `<meta name="twitter:image" content="https://cdn.x/b.jpg">`,
        "https://x",
      ),
    )?.toMatchObject({ image: "https://cdn.x/b.jpg" });
    expect(pageImage("<p>nothing</p>", "https://x")).toBeNull();
    expect(
      pageImage(
        `<meta property="og:image" content="javascript:alert(1)">`,
        "https://x",
      ),
    ).toBeNull();
  });

  test("image sizes from headers", () => {
    const png = new Uint8Array(24);
    png.set([0x89, 0x50, 0x4e, 0x47], 0);
    new DataView(png.buffer).setUint32(16, 1200);
    new DataView(png.buffer).setUint32(20, 630);
    expect(imageSize(png)).toEqual({
      width: 1200,
      height: 630,
      type: "image/png",
    });

    const gif = new TextEncoder().encode("GIF89a\x10\x00\x20\x00");
    expect(imageSize(gif)).toMatchObject({ width: 16, height: 32 });

    const jpeg = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11,
      0x08, 0x02, 0x58, 0x03, 0x20, 0x03, 0x01, 0x22, 0x00,
    ]);
    expect(imageSize(jpeg)).toEqual({
      width: 800,
      height: 600,
      type: "image/jpeg",
    });
    expect(imageSize(new Uint8Array([1, 2, 3]))).toBeNull();
  });

  test("private hosts are refused", () => {
    for (const host of [
      "localhost",
      "127.0.0.1",
      "10.0.0.2",
      "192.168.1.1",
      "172.20.0.1",
      "169.254.169.254",
      "[::1]",
    ])
      expect(isPrivateHost(host)).toBe(true);
    expect(isPrivateHost("metmuseum.org")).toBe(false);
  });
});

describe("joining with the collection", () => {
  const entry = (patch: Partial<TasteRecord>): TasteRecord => ({
    _id: "id1",
    title: "palladium",
    url: "https://www.palladiummag.com/",
    createdAt: 1,
    screenshotUrls: ["https://x.convex.cloud/a.png"],
    ...patch,
  });
  const items = [
    entry({}),
    entry({
      _id: "id2",
      slug: "oil-paint-brush",
      title: "oil",
      url: "https://www.shadertoy.com/view/MtKcDG",
      screenshotUrls: [],
      media: [
        {
          id: "m",
          kind: "video",
          url: "https://x/v.mp4",
          poster: "https://x/p.jpg",
          width: 640,
          height: 360,
        },
      ],
    }),
    entry({ _id: "id3", title: "unlinked", url: "https://elsewhere.dev" }),
  ];
  const index = indexEntries(items);

  test("matches by entry link, slug, and same source page", () => {
    expect(findEntry(index, { entryKey: "id1" })?._id).toBe("id1");
    expect(findEntry(index, { url: "/taste/oil-paint-brush" })?._id).toBe(
      "id2",
    );
    expect(findEntry(index, { url: "https://palladiummag.com" })?._id).toBe(
      "id1",
    );
    expect(findEntry(index, { url: "https://nope.dev" })).toBeUndefined();
  });

  test("entry pictures win over previews; posters stand in for video", () => {
    expect(entryPicture(items[1])).toMatchObject({
      src: "https://x/p.jpg",
      width: 640,
    });
    const previews = new Map([
      [
        "https://nope.dev",
        {
          source: "https://nope.dev",
          image: "https://nope.dev/og.png",
          width: 1200,
          height: 630,
        },
      ],
    ]);
    expect(
      join({ url: "https://palladiummag.com" }, index, previews),
    ).toMatchObject({
      href: "/taste/id1",
      picture: { origin: "entry" },
    });
    expect(join({ url: "https://nope.dev" }, index, previews)).toMatchObject({
      href: "https://nope.dev",
      picture: {
        origin: "preview",
        src: "/api/taste/preview?source=https%3A%2F%2Fnope.dev",
      },
    });
    expect(
      sourcesNeedingPreviews(
        ["https://palladiummag.com", "https://nope.dev"],
        index,
      ),
    ).toEqual(["https://nope.dev"]);
  });

  test("entries nothing in tetrastack points at are listed separately", () => {
    const stack = parseTetrastack({
      sha: "x",
      updatedAt: 0,
      origin: "snapshot",
      files: { "taste.md": TASTE.replace("kh784", "id1") },
    });
    expect(unreferenced(items, stack).map((i) => i._id)).toEqual([
      "id2",
      "id3",
    ]);
  });
});
