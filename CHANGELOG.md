# Changelog

All notable changes to this project will be documented in this file.

## Next Steps

1.  **Blog Integration:** Build `/blog` route by fetching and parsing the external RSS feed from `https://blog.tetraslam.world/rss`. Render post list and individual posts.
2.  **Interactive Resume Page:** Create `/app/resume/page.tsx`. Link existing nav/buttons to `/resume`. Add a prominent PDF download button on the new page.
3.  **About Page Sections:** Add "Uses" and "Media Mentions" components/sections to `app/about/page.tsx`. Populate with initial content.
4.  **Oomfboard Enhancements:** Add location filtering (similar to projects). Implement basic pagination. Define display ranking via a data array in `oomfboard.tsx` or a dedicated data file.
5.  **Sitemap Generation:** Install and configure `next-sitemap` to generate `sitemap.xml` on build.
6.  **Dynamic OG Images:** (todo)
7.  ~~**Newsletter Signup Form:** Create a simple component for Beehiiv signup (using embed or direct form POST). Add it strategically (e.g., below blog posts, in Support section).~~ ✅ Done.

### 2025-xx-xx – Oomfboard Enhancements & Sitemap

• Added ranking array & `location` field to friend data; friends sorted by `FRIEND_DISPLAY_ORDER`.  
• New filters: location + vibe thresholds; interest list auto-generated.  
• Pagination (6 per page) with prev/next controls.  
• `next-sitemap` configured (`postbuild`) for automatic `sitemap.xml` & `robots.txt`.  
• TODO: dynamic Open Graph image endpoint using @vercel/og.

### 2025-xx-xx – Newsletter

• `NewsletterForm` component rendering Beehiiv slim iframe.  
• Inserted at bottom of blog index & single-post pages.

---

## Next Steps (High-Priority)

1. **Spotify "Now Playing" Widget** – Pull real-time track via Spotify Web API; animated vinyl icon.  
2. **Collaborative Pixel-Art Board** – Live canvas using yjs + P2P awareness; footer modal.
3. **Dynamic OG Images** – hook `/api/og` endpoint into route metadata (still pending).

## Future (cool but heavier, park for now)

1. Interactive timeline of projects & milestones  
2. "Build-of-the-week" random highlight  
3. Live sensor readout via WebUSB  
4. In-browser REPL for SHFLA / Pulsar  
5. 3-D voxel neural network  
6. Real-time visitor globe  
7. Fluid "Ship / Sink" voting sim  
8. AR sticky-note mode  
9. Procedural soundtrack  
10. Conlang word-of-the-day widget  
11. Robot control panel over WebSerial  
12. Persona AI chatbot  
13. Retro DOS easter-egg  
14. Site exploration achievement badges  
15. Collaborative doodle pad (non-pixel)  
16. Real-time commit diff viewer  
17. Random tech-stack generator  
18. Infinite fractal gallery  
19. Scrollytelling ML paper explainer  
20. Browser tinygrad demo  
21. Map overlay of friend locations  
22. Newsletter archives rendered as MDX  
23. Dynamic fractal favicon  
24. Digital garden graph of notes  
25. ???

