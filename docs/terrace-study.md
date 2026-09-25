# Terrace study 01

Branch: `v5/living-world`. Preview route: `/terrace`.

## Scope

An art-direction proof: one generated architectural-watercolour painting, animated canal reflections and distant birds, and readable HTML around it. The inhabitants, tram, and ships are still painted into the background. This is not yet the proposed routine-driven world or a production homepage replacement.

The image is more finished architectural watercolour than loose sketchbook. Judge that direction before producing matching layers and character poses. Source concept generated with OpenAI image generation; the optimized production study is `public/terrace.webp`.

## Working contract

- The existing site remains at `/`; `/terrace` opts out of the shared site chrome through `SiteFrame`.
- Atomic visual unit: one 1536 × 1024 painting and its aligned, transparent canvas. No runtime service or generated decisions.
- React owns canvas lifecycle. One effect owns its image loader, animation frame, visibility listener, and intersection observer. Cleanup cancels them all.
- The local active clock pauses off-screen or in a hidden tab, and resumes without replaying missed time. Rendering is capped at 24 fps. Reduced motion and manual pause retain the still painting.
- Native HTML owns text, disclosure, and links. The preview is noindex. The existing text directory remains available.
- Canvas 2D is sufficient for this two-effect proof. Reconsider PixiJS when separable characters, occlusion layers, and routines exist.

## Evidence and next gate

Verified in Chrome at desktop width and 390px mobile width: painting loads, no horizontal overflow, disclosure opens, canvas frames change during playback, manual pause clears the overlay, and reduced-motion mode leaves a clear canvas with no motion control. The original homepage still renders with its navigation. Production build and TypeScript pass; all changed TypeScript/CSS files pass Biome. Repository-wide lint reports hundreds of existing errors in unrelated files. Background-tab lifecycle and a 30-minute soak still need direct verification. A long-running population simulation and layered character animation remain unproven and unimplemented.

Next art gate: approve or revise the painting. Then produce clean scenery behind one character, consistent poses, and an occlusion mask before implementing that character's routine. Do not substitute sliding cutouts for believable animation.
