export interface Thought {
  id: string;
  text: string;
  category: 'tech' | 'philosophy' | 'anime' | 'gaming' | 'linguistics' | 'misc.';
  mood: 'playful' | 'thoughtful' | 'accelerationist' | 'analytical';
}

const THOUGHTS: Thought[] = [
  {
    id: '1',
    text: "What if we could encode linguistic structures directly into neural architectures?",
    category: 'linguistics',
    mood: 'analytical'
  },
  {
    id: '2',
    text: "I love roguelikes because they remind me to be consistent and persistent.",
    category: 'gaming',
    mood: 'thoughtful'
  },
  {
    id: '3',
    text: "Accelerationism without ethics is just chaos. We need both speed and direction.",
    category: 'philosophy',
    mood: 'accelerationist'
  },
  {
    id: '4',
    text: "Dr. Stone is basically a Civ speedrun.",
    category: 'anime',
    mood: 'playful'
  },
  {
    id: '5',
    text: "If you have no hobbies, I can't take you seriously.",
    category: 'misc.',
    mood: 'playful'
  },
  {
    id: '6',
    text: "People don't realize why LLMs are so useful. It's now cheaper, and faster, to generate a 3D model using an LLM writing code than it is to run a text-to-3D model.",
    category: 'tech',
    mood: 'analytical'
  },
  {
    id: '7',
    text: "When I pack up my things and move to the Japanese countryside, you'll know I've made it.",
    category: 'misc.',
    mood: 'thoughtful'
  },
  {
    id: '8',
    text: "Probability isn't real but it describes everything that is.",
    category: 'philosophy',
    mood: 'analytical'
  },
  {
    id: '9',
    text: "Every game is a roguelike if you refuse to save.",
    category: 'gaming',
    mood: 'playful'
  },
  {
    id: '10',
    text: "Nobody actually likes democracy, they just hate the alternatives.",
    category: 'misc.',
    mood: 'thoughtful'
  },
  {
    id: '11',
    text: "Most tech 'geniuses' are just good at resource allocation. Why else would Factorio be so successful? Everyone in the field wants to feel like they're building an empire.",
    category: 'tech',
    mood: 'thoughtful'
  },
  {
    id: '12',
    text: "Shoegaze is depressed teenage girl music but the lyrics are undiscernible so nobody knows what it's about.",
    category: 'misc.',
    mood: 'thoughtful'
  },
  {
    id: '13',
    text: "The most horrifying thing about dystopias is how boring they are.",
    category: 'misc.',
    mood: 'thoughtful'
  },
  {
    id: '14',
    text: "Every programming language is bad, but some are bad in a way that makes them fun to use.",
    category: 'tech',
    mood: 'thoughtful'
  },
  {
    id: '15',
    text: "Fishing minigames will sell me on any game.",
    category: 'gaming',
    mood: 'playful'
  },
  {
    id: '16',
    text: "No don't shut up keep yapping",
    category: 'misc.',
    mood: 'playful'
  },

];


export function getRandomThought(): Thought {

  const randomIndex = Math.floor(Math.random() * THOUGHTS.length);
  return THOUGHTS[randomIndex];
}

export function getThoughtsByCategory(category: Thought['category']): Thought[] {
  return THOUGHTS.filter(thought => thought.category === category);
}

export function getThoughtsByMood(mood: Thought['mood']): Thought[] {
  return THOUGHTS.filter(thought => thought.mood === mood);
} 