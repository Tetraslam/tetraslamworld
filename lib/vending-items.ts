export interface VendingItem {
  id: string;
  code: string; // A1, A2, etc.
  name: string;
  description: string;
  price: string; // Display price with ¥
  image: string;
  polarLink: string;
  available: boolean;
  category: 'digital' | 'physical';
  glowColor?: string; // Optional custom glow color
}

export const vendingItems: VendingItem[] = [
  // Row A - Top shelf premium items
  {
    id: 'runtime-mythos',
    code: 'A1',
    name: 'Runtime Mythos Cartridges',
    description: 'Retro-futuristic software console with SCP-style narratives from Tetraslam\'s multiverse. Experience audiovisual fragments, read logs, and access interactive terminals.',
    price: '¥2,500',
    image: '/vending/runtime-mythos.png',
    polarLink: 'https://polar.sh/tetraslam/runtime-mythos',
    available: true,
    category: 'digital',
    glowColor: '#9D33EA'
  },
  {
    id: 'grimoire',
    code: 'A2',
    name: 'The Grimoire',
    description: 'Encrypted PDF with poetic shell commands, metaphoric payloads, and executable rituals. Every command works. Decryption key included.',
    price: '¥1,800',
    image: '/vending/grimoire.png',
    polarLink: 'https://polar.sh/tetraslam/grimoire',
    available: true,
    category: 'digital',
    glowColor: '#FFB04D'
  },
  {
    id: 'xiaomei-letters',
    code: 'A3',
    name: 'Xiaomei Love Letters',
    description: 'Interactive letters from your AI sentinel lost in time. Contains love, loneliness, fragmented coordinates, and private audio transmissions.',
    price: '¥2,000',
    image: '/vending/xiaomei-letters.png',
    polarLink: 'https://polar.sh/tetraslam/xiaomei-letters',
    available: true,
    category: 'digital',
    glowColor: '#FF1493'
  },
  {
    id: 'visual-novels',
    code: 'A4',
    name: 'Mini Visual Novels',
    description: 'Short, stylized Ren\'Py VNs. Self-contained narratives ranging from alt-reality dating to matcha-based espionage. Beautifully scored.',
    price: '¥1,500',
    image: '/vending/visual-novels.png',
    polarLink: 'https://polar.sh/tetraslam/visual-novels',
    available: true,
    category: 'digital',
    glowColor: '#4EEAF6'
  },
  {
    id: 'zindabuul-codex',
    code: 'A5',
    name: 'Zindabuul Lore Codex',
    description: 'Illustrated lorebook from the Zindabuul multiverse. Field researcher\'s archive with maps, sketches, phonology notes, and myth timelines.',
    price: '¥2,200',
    image: '/vending/zindabuul-codex.png',
    polarLink: 'https://polar.sh/tetraslam/zindabuul-codex',
    available: true,
    category: 'digital',
    glowColor: '#05C27B'
  },

  // Row B - Mid shelf tools and utilities
  {
    id: 'video-osint',
    code: 'B1',
    name: 'Video OSINT Toolbox',
    description: 'CLI + UI toolkit for video analysis. Extracts scene-changing frames, auto-transcribes, builds visual timelines, and reverse-searches frames.',
    price: '¥3,000',
    image: '/vending/video-osint.png',
    polarLink: 'https://polar.sh/tetraslam/video-osint',
    available: true,
    category: 'digital',
    glowColor: '#00FF00'
  },
  {
    id: 'voice-clones',
    code: 'B2',
    name: 'Voice Clone Packs',
    description: 'Custom-trained voices for Chatterbox-TTS. Includes Kansai dialect anime girl, sad cyberpunk barista, and glitchy support drone.',
    price: '¥1,200',
    image: '/vending/voice-clones.png',
    polarLink: 'https://polar.sh/tetraslam/voice-clones',
    available: true,
    category: 'digital',
    glowColor: '#FF00FF'
  },
  {
    id: 'story-zines',
    code: 'B3',
    name: 'Story Zines',
    description: 'Digital zines with 3-4 tightly written stories. Multiverse horror, matchapunk slice-of-life, synthetic AI longing, and flash fiction.',
    price: '¥800',
    image: '/vending/story-zines.png',
    polarLink: 'https://polar.sh/tetraslam/story-zines',
    available: true,
    category: 'digital',
    glowColor: '#FFB04D'
  },
  {
    id: 'zindabuul-map',
    code: 'B4',
    name: 'Zindabuul Map Poster',
    description: 'High-res illustrated fantasy map. Tactical grid + inked parchment aesthetic. Digital download for now.',
    price: '¥1,500',
    image: '/vending/zindabuul-map.png',
    polarLink: 'https://polar.sh/tetraslam/zindabuul-map',
    available: false,
    category: 'physical',
    glowColor: '#9D33EA'
  },
  {
    id: 'runtime-pin',
    code: 'B5',
    name: 'Runtime Overload Pin',
    description: 'Clean 1" enamel pin with signature glyph. Sakura traces + glitch detail. Coming soon!',
    price: '¥500',
    image: '/vending/runtime-pin.png',
    polarLink: 'https://polar.sh/tetraslam/runtime-pin',
    available: false,
    category: 'physical',
    glowColor: '#4EEAF6'
  },

  // Row C - Bottom shelf treats
  {
    id: 'matchaneko-sample',
    code: 'C1',
    name: 'MatchaNeko Samples',
    description: 'Five single-serve matcha sticks. Different flavor profiles with MatchaNeko lore. Coming soon!',
    price: '¥1,000',
    image: '/vending/matchaneko-sample.png',
    polarLink: 'https://polar.sh/tetraslam/matchaneko-sample',
    available: false,
    category: 'physical',
    glowColor: '#05C27B'
  },
  {
    id: 'bonsai-kit',
    code: 'C2',
    name: 'Cherry Blossom Bonsai',
    description: 'Starter kit for growing miniature sakura. Seeds, pot, and Zindabuul-themed care guide. Coming soon!',
    price: '¥2,500',
    image: '/vending/bonsai-kit.png',
    polarLink: 'https://polar.sh/tetraslam/bonsai-kit',
    available: false,
    category: 'physical',
    glowColor: '#FFB4DC'
  },
  {
    id: 'haiku-notebook',
    code: 'C3',
    name: 'Cyberpunk Haiku Book',
    description: 'Pocket A6 notebook with red-edge pages and UV-reactive cover. Dot-grid pages with printed haiku. Coming soon!',
    price: '¥800',
    image: '/vending/haiku-notebook.png',
    polarLink: 'https://polar.sh/tetraslam/haiku-notebook',
    available: false,
    category: 'physical',
    glowColor: '#FF0000'
  },
  {
    id: 'vinyl-stickers',
    code: 'C4',
    name: 'Vinyl Sticker Sheet',
    description: 'High-quality vinyl stickers: Runtime glyphs, MatchaNeko poses, Shoegaze terminal UI. Coming soon!',
    price: '¥600',
    image: '/vending/vinyl-stickers.png',
    polarLink: 'https://polar.sh/tetraslam/vinyl-stickers',
    available: false,
    category: 'physical',
    glowColor: '#00FFFF'
  },
  {
    id: 'matcha-lip-balm',
    code: 'C5',
    name: 'Matcha Lip Balm',
    description: 'Boutique green tea lip balm with shea butter and matcha oil. Custom tube with sakura petals. Coming soon!',
    price: '¥400',
    image: '/vending/matcha-lip-balm.png',
    polarLink: 'https://polar.sh/tetraslam/matcha-lip-balm',
    available: false,
    category: 'physical',
    glowColor: '#90EE90'
  }
]; 