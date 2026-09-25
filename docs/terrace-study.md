# Terrace study 02: a separate inhabitant

Branch: `v5/living-world`. Preview route: `/terrace`.

## Scope and art direction

The foreground cat is now independent of the painting. It breathes, raises its head, looks toward the viewer, rises, stretches, and settles into a slightly different position. Clicking or keyboard-activating its hotspot wakes it when resting. Its first routine begins after eight active seconds; subsequent naps have varying durations. People, robots, ships, and the tram are still part of the static painting.

The base painting is generated architectural watercolour. The cat assets are separately generated painted key poses, cleaned and aligned to a shared contact baseline. Offline optical-flow interpolation supplies transition frames; runtime code chooses poses and applies a local ribcage deformation. This is pose-based animation, not a skeletal rig or video. It still needs artistic judgment on transition quality and perspective before this approach is used for other inhabitants. No new foreground occlusion mask was necessary for this cat's confined perch.

## Working contract

- Atomic visual unit: the 1536 × 1024 painting and aligned transparent canvas. All scene inputs are local assets; no service or model runs at runtime.
- The approved original painting remains the no-JavaScript, loading, failed-asset, and reduced-motion fallback. The cleaned background and cat replace it together only after both images load. A missing cat texture must never expose an empty perch.
- React owns one animation effect, its image loads, RAF, visibility listener, intersection observer, and scratch canvas. Disposal prevents late loads from restarting it.
- The active scene clock owns the cat routine. Offscreen and hidden-tab suspension preserve that clock; resuming does not replay missed wall-clock time.
- Manual pause freezes the actual rendered pose. Reduced motion restores the original still. The cat hotspot is disabled while paused and absent in reduced-motion mode.
- A greeting only advances a future wake time; it cannot interrupt or restart an active stretch. Settling offsets remain continuous across routine boundaries.
- Canvas 2D remains sufficient for this proof. Rendering is capped at 24 fps. Text, disclosure, and links remain ordinary HTML, and `/terrace` remains noindex.

## Assets and reproduction

- `public/terrace.webp`: approved still and fallback.
- `assets/terrace-clean-source.webp`: generated repair of the cat's parapet crop.
- `assets/terrace-cat-poses-source.webp`: generated twelve-pose sheet.
- `public/terrace/clean.webp`: feathered local repair composited into the painting.
- `public/terrace/cat.webp`: aligned transparent source atlas, used by the preparation script only.
- `public/terrace/cat-motion.webp`: 144 independently addressable transition frames, used at runtime.

```sh
uv run --with pillow scripts/prepare-terrace-cat.py assets/terrace-clean-source.webp assets/terrace-cat-poses-source.webp
uv run --with pillow --with opencv-python-headless scripts/interpolate-terrace-cat.py
node --test scripts/cat-motion.test.mjs
```

The interpolation script's pose sequence must match the sequence in `cat-motion.ts`. The input frames share a paw baseline, and rendering applies the same parapet shear to the character and contact shadow. The initial runtime-opacity-dissolve experiment was rejected because its silhouettes became transparent; motion-compensated source frames replace it.

## Evidence

Inspected sleeping and stretching poses at actual desktop scene scale, plus a 390px-wide mobile view. Browser checks verified keyboard wake, frozen pixels and clock on manual pause, continued time after resume, reduced-motion still fallback, no mobile horizontal overflow, and preserved still/absent hotspot with the cat atlas request aborted. Scrolling offscreen froze the active clock and returning resumed it. Actual tab switching produced hidden and visible events at the identical scene time.

Four deterministic tests cover a thirty-minute day, bounded frame selection, continuous settling offsets, greetings during sleep and active routines, frozen-clock sampling, and equivalence of sparse versus frame-by-frame advancement. This is an accelerated timeline test, not a thirty-minute browser soak. Multi-character routines and their coordination remain unimplemented.

Production build (including TypeScript) and changed-file Biome checks pass. Repository-wide lint has the previously reported unrelated baseline failures.
