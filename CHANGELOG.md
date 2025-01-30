# Changelog

All notable changes to this project will be documented in this file.

## Feature Roadmap (Priority Order)

### Phase 1: Core Interactive Features
1. Interactive Neural Network (About Section)
   - [x] Force-directed graph visualization
   - [x] Node click interactions
   - [x] Animated transitions
   - [x] Mobile-friendly interactions

2. Decision Tree ("What Would Shresht Do?")
   - [x] Tree visualization
   - [x] Path traversal animation
   - [x] Random scenario loading
   - [x] Mobile touch support

3. Travel Map
   - [x] Interactive world map
   - [x] Custom location markers
   - [x] Location details popup
   - [x] Travel path animations

### Phase 2: Dynamic Content Integration
1. Project Showcase
   - [x] Rating system
   - [x] Project cards
   - [x] Filter/sort functionality
   - [x] Detailed view modal

2. External Data Integration
   - [x] Twitter feed scraping
   - [x] Blog post fetching
   - [x] Spotify current track
   - [x] Roguelike leaderboard

### Phase 3: Additional Features
1. Personality Section
   - [x] Random thought generator
   - [x] Waifu rankings
   - [x] Friend list (Oomfboard)

2. Support Section
   - [x] Coffee link
   - [x] Calendly integration
   - [x] GitHub contribution

## [Unreleased]

### Initial Setup
- 📝 Created project documentation (README.md, INFO.md)
- 🎯 Defined project scope and requirements
- 🎨 Established visual design direction: roguelike dungeon crawler + neobrutalist aesthetic
- 🛠️ Selected tech stack: Next.js, React, TypeScript, Framer Motion, Radix UI, Tailwind CSS

### Added
- ✨ Set up Next.js project with TypeScript and Tailwind CSS
- 🎨 Configured custom theme and animations in Tailwind
- 🖱️ Implemented custom cursor with glitch and sparkle effects
- 🏗️ Created basic component structure and utility functions
- 🎭 Added Framer Motion for animations
- 🖼️ Added pixel art background pattern
- 📱 Ensured responsive layout foundation
- 🧭 Added navigation menu with pixel art aesthetic
- 🎨 Enhanced home page with hero section and project grid
- ✨ Added stagger animations to home page content
- 🔥 Implemented cozy mode with:
  - Bonfire animation with particle effects
  - Ambient color overlay
  - Lofi music integration (pending audio file)
  - Global state management
  - Smooth transitions
- 🧠 Added interactive neural network visualization:
  - Force-directed graph layout
  - Draggable nodes with physics
  - Click interactions for node details
  - Responsive sizing
  - Smooth animations
- 🌳 Added "What Would Shresht Do?" decision tree:
  - Interactive scenario navigation
  - Animated transitions between steps
  - History tracking with back navigation
  - Mobile-friendly interface
  - Responsive design
- 🗺️ Added Travel Map visualization:
  - Interactive world map with dark theme
  - Custom location markers
  - Animated travel paths
  - Location details panel
  - Activity and people tracking
- 📂 Added Project Showcase:
  - Interactive project cards with hover effects
  - Star rating system
  - Category filtering
  - Multiple sort options
  - Detailed project view modal
  - Responsive grid layout
- 🔄 Added External Data Integration:
  - Twitter feed scraping using node-html-parser
  - Blog post fetching from Prose.sh
  - Spotify embed integration
  - Roguelike leaderboard (mock data for now)
  - Dynamic content component with animations
- 💭 Added Random Thought Generator:
  - Curated collection of personal thoughts
  - Category and mood filtering
  - Smooth animations for transitions
  - Responsive design
  - Integration with personality page
- 🌟 Added Waifu Rankings:
  - Weekly updated rankings
  - Hover cards with detailed information
  - Ranking change indicators
  - Character traits and descriptions
  - Responsive design and animations
- 👥 Added Oomfboard Friend Network:
  - Interactive friend cards with hover details
  - Interest and vibe score filtering
  - Project and connection information
  - Social media links integration
  - Responsive grid layout with animations
- 🤝 Added Support Section:
  - Buy Me a Coffee integration
  - Calendly scheduling integration
  - GitHub contribution links
  - Pixel art decorations
  - Responsive grid layout
  - Hover animations and transitions
  - Additional connection information

### In Progress
- 🎯 Final testing and deployment preparation

### Planned Improvements

#### UX Enhancements
- [x] Project Details Navigation Enhancement
  - Implemented scroll-to-project functionality when clicking "Learn more"
  - Added auto-open project details modal after navigation
  - Added smooth scroll animation for better user experience

- [x] Resume Download Behavior
  - Modified resume download to open in new tab without switching focus
  - Updated anchor tag with target="_blank" and rel attributes
  - Maintained current tab focus after clicking download

#### Mobile Responsiveness Improvements
- [x] Button Consistency
  - Standardized mobile button widths
  - Fixed Download Resume button width to match other buttons

- [x] Touch Interaction Improvements
  - Converted hover cards to click/touch events on mobile for projects
  - Implemented touch-friendly interaction for OOMF cards
  - Added touch feedback indicators for better UX

- [x] Mobile Layout Optimizations
  - Adjusted anime character rankings layout for mobile
  - Removed expanded image view on mobile
  - Optimized text and traits display for full component width
  - Increased neural network component height on mobile for better node spacing
  - Preserved node count while improving readability

## [0.0.1] - 2024-01-24
### Added
- Initial repository setup
- Basic documentation
- Project planning documents
- Core styling and animation system

## [Unreleased]
- Added `vercel.json` configuration file to explicitly specify Next.js as the framework for Vercel deployments 