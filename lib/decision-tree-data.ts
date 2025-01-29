export interface DecisionNode {
  id: string;
  question: string;
  options: DecisionOption[];
}

export interface DecisionOption {
  text: string;
  nextId?: string;
  outcome?: string;
  isShreshtChoice?: boolean;
}

export const scenarios: DecisionNode[] = [
  {
    id: "start",
    question: "Problem. What kind?",
    options: [
      {
        text: "Something technical.",
        nextId: "technical",
        isShreshtChoice: true
      },
      {
        text: "Creative.",
        nextId: "creative"
      },
      {
        text: "Life-altering decisions.",
        nextId: "life"
      }
    ]
  },
  {
    id: "technical",
    question: "Alright, what are we working on?",
    options: [
      {
        text: "Inventing something nobody asked for but everybody will need.",
        nextId: "build_new",
        isShreshtChoice: true
      },
      {
        text: "Fixing something so broken it’s practically a feature.",
        nextId: "fix_broken"
      },
      {
        text: "Squeezing every drop of performance out of the thing.",
        nextId: "optimize"
      }
    ]
  },
  {
    id: "build_new",
    question: "What’s the plan?",
    options: [
      {
        text: "Prototype a data viz tool—get it working yesterday.",
        outcome: "Python + Plotly. Barebones MVP first, then add bells and whistles when someone actually cares.",
        isShreshtChoice: true
      },
      {
        text: "Build a distributed pipeline for someone who doesn't in fact need a distributed pipeline.",
        outcome: "Step 1: Whiteboard the entire design. Step 2: Elixir + Triton. Step 3: Stress test until your laptop begs for mercy. Step 4: get paid."
      },
      {
        text: "A real-time OS with embedded ML because you enjoy pain.",
        outcome: "Zig for performance, Triton for ML, and enough documentation to make future-me cry tears of joy."
      }
    ]
  },
  {
    id: "fix_broken",
    question: "What’s on fire this time?",
    options: [
      {
        text: "Your Supabase schema.",
        outcome: "Write a migration. Make sure it's idempotent. Test it. Miss 15 edge cases and spend the next week fixing them."
      },
      {
        text: "Java codebase.",
        outcome: "Work on something else."
      },
      {
        text: "State management.",
        outcome: "Cursor :)"
      }
    ]
  },
  {
    id: "optimize",
    question: "What needs to be zigged up?",
    options: [
      {
        text: "Frontend’s slower than molasses.",
        outcome: "Profile the bottlenecks. Trim the fat (bundle size). Use caching, SSR, or anything that sounds vaguely helpful."
      },
      {
        text: "Backend is wheezing under the load.",
        outcome: "Add caching to all API calls. Pretty much all you need."
      },
      {
        text: "Algorithm feels like it’s from the stone age.",
        outcome: "Re-read HPC book. Implement in Zig. Benchmark. Repeat until smug."
      }
    ]
  },
  {
    id: "creative",
    question: "What kind of project are we brewing?",
    options: [
      {
        text: "A 2D roguelike with better lore than most AAA games and zero budget.",
        nextId: "roguelike",
        isShreshtChoice: true
      },
      {
        text: "Writing—time to make people cry (or think).",
        nextId: "writing"
      },
      {
        text: "Worldbuilding, because the real world is boring.",
        nextId: "worldbuilding"
      }
    ]
  },
  {
    id: "roguelike",
    question: "What’s the design goal?",
    options: [
      {
        text: "Juicy mechanics and crunchy gameplay.",
        outcome: "Prototype the core loop. Balance is for later—you’re here to make people addicted."
      },
      {
        text: "Lore so deep people fall into it headfirst.",
        outcome: "Start with a core mystery. Build factions, conflicts, and obscure details for fans to fight over."
      },
      {
        text: "A UI that doesn’t make people uninstall.",
        outcome: "Wireframe the experience. Test every pixel. Iterate until you don’t hate looking at it."
      }
    ]
  },
  {
    id: "writing",
    question: "What are we putting into words?",
    options: [
      {
        text: "Technical docs nobody will read (but they should).",
        outcome: "Explain why, not just how. Include code samples. Future-proof the structure so it doesn’t rot. Re-visit that one CUDA guide which Modal made.",
        isShreshtChoice: true
      },
      {
        text: "Blog post.",
        outcome: "Start with a hot take. Add examples, visuals, and your personal flair. Make it so good people share it unprompted."
      },
      {
        text: "README.",
        outcome: "Cover setup, usage, contribution guidelines, and a killer demo. Keep it sleek and to the point."
      }
    ]
  },
  {
    id: "worldbuilding",
    question: "What’s the scope of this universe?",
    options: [
      {
        text: "A game world that people want to get lost in.",
        outcome: "Gameplay comes first. Build mechanics that force lore to make sense. Let the players discover secrets naturally."
      },
      {
        text: "An entire story universe, sprawling and complex.",
        outcome: "Establish your world’s rules first. Then its history. Finally, figure out what stories people actually want to hear."
      },
      {
        text: "A virtual space people actually want to hang out in.",
        outcome: "Focus on interaction first, then aesthetics. Build features that make people feel like they belong."
      }
    ]
  },
  {
    id: "life",
    question: "What are we existential about?",
    options: [
      {
        text: "Career or education moves.",
        nextId: "career",
        isShreshtChoice: true
      },
      {
        text: "Personal growth, because you’re tired of being mid.",
        nextId: "growth"
      },
      {
        text: "Relationships.",
        nextId: "relationships"
      }
    ]
  },
  {
    id: "career",
    question: "What’s the vibe?",
    options: [
      {
        text: "Learn something new and flex your brain.",
        outcome: "Pick a skill. Go deep. Build something with it. Bonus points if you teach someone else.",
        isShreshtChoice: true
      },
      {
        text: "Get experience. Real, messy experience.",
        outcome: "Find projects that force you to grow. Work with smart people. Document everything."
      },
      {
        text: "Level up.",
        outcome: "High-impact projects. Measurable results. Build the portfolio that makes recruiters sweat."
      }

    ]
  },
  {
    id: "growth",
    question: "What are we leveling up?",
    options: [
      {
        text: "Health.",
        outcome: "Set goals you can actually hit. Build habits. Be kind to yourself when you slip up."
      },

      {
        text: "Hobbies.",
        outcome: "Pick something that excites you. Find a community around it. Share your progress."
      },


      {
        text: "Mindset.",
        outcome: "Read, reflect. Learn from failures. Progress > perfection."
      }

    ]
  },
  {
    id: "relationships",
    question: "What kind of relationship are we fixing or building?",
    options: [
      {
        text: "Professional.",
        outcome: "Show up, follow through, and overdeliver. Build your reputation with substance, not flash."
      },

      {
        text: "Personal.",
        outcome: "Listen more than you talk. Be consistent. Be vulnerable but with boundaries."
      },

      {
        text: "Community",
        outcome: "Support others. Share resources. Give way more than you take."
      }




    ]
  }
];
