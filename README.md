# Website Redesign README for Cursor

## Project Overview
This project aims to create a personal website for Shresht that is fun, tasteful, and thoughtful. The website will showcase Shresht’s projects, personality, interests, and work in a way that is both visually stunning and technically impressive. The goal is to balance playfulness and professionalism, capturing Shresht’s unique personality while avoiding boring developer portfolio tropes. The design will follow a pixelated roguelike dungeon crawler aesthetic with neobrutalist elements, while incorporating dynamic features and interactive elements.

## Visual Design Direction
- **Aesthetic:** A mix of roguelike dungeon crawler, Stardew Valley pixel art, and neobrutalist elements.
- **Coloring:** Darker tones with pixel art flourishes; avoid traditional neobrutalist coloring.
- **Tone and Voice:** Playful but not overly jokey; thoughtful and engaging.
- **Cursor:** Pixelated old-school cursor that glitches into a sparkling animation over clickable elements.
- **Animations:** Subtle, performance-friendly animations (e.g., Stardew Valley-style dynamic background).

## Key Sections and Features
### Home Page
- **Introduction:** Full-screen bold text with your name, tagline, and a pixelated portrait.
- **Highlights Grid:** A clickable mosaic summarizing your top interests and projects, with hover effects.

### Project Showcase
- **Details:** Picture, title, description, date, tech stack, and notable outcomes.
- **Dynamic Ordering:** Projects ordered by a “rate my projects” star button.

### Personality Section
- **Interactive Features:**
  - Click-to-reveal fun facts.
  - Random thought generator (using a fine-tuned Llama model).
  - "What would Shresht do?" decision tree (loads a random static tree).
  - Weekly waifu ranking (fetched from Waifu API).
- **Oomfboard:** A playful friend list styled in the same aesthetic.
- **Game Leaderboard:** Automatically updated leaderboard of Shresht’s roguelike runs.

### About Me
- **Interactive Neural Network:** Clickable nodes reveal details about Shresht in an engaging, nonlinear way.
- **Documentation:** A satirical, documentation-style page presenting Shresht’s skills and traits.

### Dynamic Elements
- **Live Twitter Feed:** Display latest tweets without using an API.
- **Blog Feed:** Pull posts from blog.tetraslam.world (hosted on prose.sh).
- **Travel Map:** Interactive map showing places Shresht has visited, with notes on activities and people met.
- **Spotify Embed:** Recently played music displayed dynamically.
- **Plans:** Extensible section listing Shresht’s future plans, styled for clarity and creativity.

### Miscellaneous Features
- **Favorite Resources:** A unique section showcasing favorite papers, blogs, links, tools, and software.
- **Top 10 Lists:** Rotating monthly top 10 (anime, books, movies, songs, etc.), manually updated.
- **Support Section:** Links to buy Shresht a coffee, submit a pull request, or schedule an internship discussion via Calendly.
- **Cozy Mode:** A toggle adding a pixel art bonfire, lofi music, and bonfire sounds.
- **Math Favorites:** Fun-styled LaTeX solutions and math problems, with user-submitted suggestions.
- **Anime List:** Well-designed list of favorite anime.
- **Pixel Art Favorites:** Weekly updated favorite pixel arts.

## Technical Requirements
### Tech Stack
- **Frontend:** Next.js + React + TypeScript + Framer Motion for animations.
- **Backend:** No backend (static site with dynamic features handled client-side).
- **Hosting:** GitHub for file storage, Vercel for deployment.
- **Styling:** Tailwind CSS or a similar utility-first CSS framework.

### Performance Notes
- **Dynamic Background:** Use a performant JS library for Stardew Valley-style animations.
- **Travel Map:** Consider libraries like Leaflet.js or D3.js for interactive travel visualizations.
- **Interactive Neural Network:** Use D3.js or a similar library to make the graph interactive.

### Exclusions
- **Parallax Scrolling:** Avoid it to maintain performance and align with aesthetic.
- **Generic Multi-Page Design:** Use a single-page application (SPA) structure.
- **Overly Minimalistic Designs:** Ensure the site feels rich and vibrant.

## Developer Notes
- Prioritize coherent, readable code for future extensibility.
- Ensure the website is responsive and performs well on both desktop and mobile.
- Use placeholder assets and mock data for features requiring dynamic inputs during development.

## Deployment Workflow
1. Clone the GitHub repository.
2. Run `npm install` to set up dependencies.
3. Develop locally with `npm run dev`.
4. Deploy to Vercel via GitHub integration.

