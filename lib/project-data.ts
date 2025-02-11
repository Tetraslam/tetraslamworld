import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  techStack: string[];
  links: {
    github?: string;
    demo?: string;
    blog?: string;
    website?: string;
    comingsoon?: string;
  };
  achievements: string[];
  category: 'software' | 'hardware' | 'research' | 'creative';
  date: string;
  stars?: number;
}

export const projects: Project[] = [
  {
    id: "shfla",
    title: "SHFLA",
    description: "Shoegaze rock-inspired, Turing-complete fractal music language",
    longDescription: "A cool language I built which combines the Julia set with shoegaze rock, creating a Turing-complete system for generating complex musical structures and meaning :)",
    image: "/projects/shfla.png", 
    techStack: ["Python", "Music Theory", "Fractals"],
    links: {
      github: "https://github.com/tetraslam/shfla"
    },
    achievements: [
      "MIT Media Lab hackathon winner",
      "Front page of Hacker News for 2 days",
      "50+ GitHub stars",
      "Demos with Stephen Wolfram, Joscha Bach, Curt Jaimungal, Dr. Manolis Kellis, and Suno AI"
    ],
    category: "software",
    date: "2024-10",
    stars: 0
  },
  {
    id: "sapientia",
    title: "Sapientia Research",
    description: "Applied math and emergent technology research lab",
    longDescription: "Building the most awesome applied math lab with Yoyo Yuan; our first project is a general-purpose biocomputer!",
    image: "/projects/sapientia.png",
    techStack: ["Python", "C++", "Arduino", "Rat neurons"],
    links: {
      website: "https://sapientiaresearch.org"
    },
    achievements: [
      "Accepted into The Residency",
      "Developed novel biocomputing architecture",
      "Published research papers"
    ],
    category: "research",
    date: "2024-08",
    stars: 0
  },
  {
    id: "oomfboard",
    title: "Oomfboard",
    description: "Whimsical social platform for creative connections",
    longDescription: "A playful web platform that visualizes connections between people through interactive profiles and creative project sharing, made for tpot.",
    image: "/projects/oomfboard.png", // We'll add this later
    techStack: ["Next.js", "Tailwind", "Supabase"],
    links: {
      demo: "https://oomfboard.com"
    },
    achievements: [
      "100+ active users",
      "My first consumer app",
      "Currently iterating on a new version"
    ],
    category: "software",
    date: "2024-12",
    stars: 0
  },
  {
    id: "kpop-formations",
    title: "KADA: K-pop Dance Formation Generator",
    description: "AI-powered dance formation visualization",
    longDescription: "Uses computer vision and AI to analyze K-pop dance performances, generating dynamic visualizations of dancer positions and formations. Integrates YOLO v8 for position detection and DeepFace for facial recognition.",
    image: "/projects/kada.png", 
    techStack: ["Python", "YOLOv8", "OpenCV"],
    links: {
      github: "https://github.com/tetraslam/kada",
      demo: "https://devpost.com/software/kada-kpop-advanced-dance-analyzer"
    },
    achievements: [
      "Used by Northeastern's K-pop dance team",
      "Boston hacks runner-up"
    ],
    category: "software",
    date: "2024-11",
    stars: 0
  },
  {
    id: "neuromech",
    title: "Neuromechanics of Movement",
    description: "Building reinforcement learning models for humans, robots, and exoskeletons.",
    longDescription: "Building a neuromorphic computer with a team of 5; we're using the Intel Loihi 2 chip to build a general-purpose computer.",
    image: "/projects/neuromech.png", 
    techStack: ["Pytorch", "MuJoCo", "CUDA"],
    links: {
      website: "https://neumove.org/people.html"
    },
    achievements: [
      "First-year researcher at the lab",
      "Full-body musculoskeletal controllers"
    ],
    category: "research",
    date: "2024-09",
    stars: 0
  },
  {
    id: "medialab",
    title: "ML & Digital Twin Research @ MIT Media Lab",
    description: "Researching personal AI and digital twins",
    longDescription: "Building digital twin models, using ML to predict human behavior, creating embeddings which simulate human preferences for dating/shopping/decision-making, and more!",
    image: "/projects/medialab.png", 
    techStack: ["Pytorch", "Linguistics", "Transformers"],
    links: {
      website: "https://www.media.mit.edu/groups/fluid-interfaces/overview/"
    },
    achievements: [
      "Building SOTA models for human behavior prediction",
      "Building a digital twin of my own"
    ],
    category: "research",
    date: "2025-01",
    stars: 0
  },
  {
    id: "robocup",
    title: "RoboCup 2023",
    description: "Won RoboCup 2023",
    longDescription: "Competed in RoboCup 2023, the world's largest robotics competition, with a team of 4 and zero funding.",
    image: "/projects/robocup.png", 
    techStack: ["Python", "ROS2", "Raspberry Pi"],
    links: {
      website: "https://www.robocup.org/"
    },
    achievements: [
      "Captain of the Indian team",
      "Won the RoboCup 2023 Onstage League, international finalist"
    ],
    category: "research",
    date: "2023-07",
    stars: 0
  },
  {
    id: "glyphs",
    title: "Algorithmically Generating Glyphs",
    description: "Making some glyphs for my conlang!",
    longDescription: "I'm a massive worldbuilder and conlanger, and I've been working on a conlang called Qurwenyan. This blog post shows how I algorithmically generated glyphs for my conlang!",
    image: "/projects/glyphs.png", 
    techStack: ["Python", "FontForge", "Polyglot"],
    links: {
      blog: "https://tetraslam.beehiiv.com/p/generating-glyphs",
      github: "https://github.com/tetraslam/qurwenyan"
    },
    achievements: [
      "Cool symbols",
      "My first beehiiv.com blog post"
    ],
    category: "creative",
    date: "2024-05",
    stars: 0
  },
  {
    id: "scubadiving",
    title: "Scuba Diving",
    description: "Got my PADI certification!",
    longDescription: "I'm a PADI-certified scuba diver, and I've been diving in the Andamans, the Mediterranean, and the Indian Ocean!",
    image: "/projects/scubadiving.png", 
    techStack: ["PADI", "Diving"],
    links: {
    },
    achievements: [
      "Saw sharks, turtles, eels, octopi, clownfish, and more!",
      "Am qualified to dive up to 16m :)"
    ],
    category: "creative",
    date: "2022-12",
    stars: 0
  },
  {
    id: "fire",
    title: "Computational Linguistics",
    description: "Won best paper at the 2022 Forum for Information Retrieval Evaluation",
    longDescription: "I was just getting into the field, and collaborated on a TF-IDF paper for sentiment analysis in the Urdu language.",
    image: "/projects/fire.png", 
    techStack: ["Python", "Linguistics", "TF-IDF"],
    links: {
      website: "https://ceur-ws.org/Vol-3395/T4-7.pdf"
    },
    achievements: [
      "Won best paper at the 2022 Forum for Information Retrieval Evaluation",
      "Learned a lot about information retrieval and got into ML"
    ],
    category: "research",
    date: "2022-06",
    stars: 0
  },
  {
    id: "lagrangiansubmanifolds",
    title: "Proving Natural Laws with Lagrangian Submanifolds",
    description: "A series of python notebooks and blogs.",
    longDescription: "I'm a huge fan of Lagrangian mechanics after reading Curt Jaimungal's twitter posts, and I've been working on a series of python notebooks and blog posts on proving natural laws with program-synthesized Lagrangian submanifolds.",
    image: "/projects/lagrangiansubmanifolds.png", 
    techStack: ["Python", "Lagrangian Mechanics"],
    links: {
      github: "https://github.com/tetraslam/lagrangian-submanifolds"
    },
    achievements: [
      "Proved classical and quantum mechanics from first principles",
      "Built my first program synthesis DSL",
      "Learned symplectic geometry"
    ],
    category: "software",
    date: "2025-01",
    stars: 0
  },
  {
    id: "fiberfinder",
    title: "FiberFinder",
    description: "A textile recycling ML model",
    longDescription: "I built an ML model to identify non-textile materials in textile waste + approach vectors for robotic textile recycling.",
    image: "/projects/fiberfinder.png", 
    techStack: ["Python", "ML", "Robotics"],
    links: {
      demo: "https://www.youtube.com/watch?v=IPewmG49Eic"
    },
    achievements: [
      "Finalist in the Blue Ocean Competition",
      "Now implemented in Bangalore's waste management system"
    ],
    category: "software",
    date: "2023-01",
    stars: 0
  },
  {
    id: "pocketrealms",
    title: "Pocket Realms",
    description: "A fictional research paper about Zindabuul's magic system.",
    longDescription: "I'm a major worldbuilder, and I've been working on a fictional research paper about Zindabuul's magic system. This is the first draft of the paper, and I'm currently refining the system.",
    image: "/projects/pocketrealms.png", 
    techStack: ["Worldbuilding", "Magic Systems"],
    links: {
      website: "https://drive.google.com/file/d/1_xQOQ5ATMjw_hJuhjTZ1qr1r9nN1WTiH/view?usp=sharing"
    },
    achievements: [
      "Fun project!",
      "Made my own poetry system"
    ],
    category: "creative",
    date: "2024-01",
    stars: 0
  },
  {
    id: "forty",
    title: "Forty Questions To Ask Yourself Every Year",
    description: "My take on Steph Ango's list.",
    longDescription: "This is a blog post I wrote answering Steph Ango's list of 40 questions to ask yourself every year.",
    image: "/projects/forty.png", 
    techStack: ["Writing", "Prose.sh"],
    links: {
      blog: "https://blog.tetraslam.world/40_questions_year"
    },
    achievements: [
      "Reflective post",
      "Practiced writing in a style I'm not used to"
    ],
    category: "creative",
    date: "2024-05",
    stars: 0
  },
  {
    id: "hello",
    title: "A cool list of things about me",
    description: "My personality in 2025, captured in a list",
    longDescription: "This is my first blog post, and I'm excited to start writing more!",
    image: "/projects/hello.png", 
    techStack: ["Writing", "Prose.sh"],
    links: {
      blog: "https://blog.tetraslam.world/hello"
    },
    achievements: [
      "My first blog post",
      "Learned how to use prose.sh (awesome tool)"
    ],
    category: "creative",
    date: "2024-11",
    stars: 0
  },
  {
    id: "prosperousss",
    title: "Prosperousss",
    description: "My financial digital twin software",
    longDescription: "Sophia Fu and I built a financial digital twin for a fintech hackathon, and won first place (and $1000)! It allows marketers, governments, banks, and consumers to understand the financial health of a demographic, and to make better pricing and policy decisions.",
    image: "/projects/prosperousss.png", 
    techStack: ["Next.js", "Pytorch", "Tailwind"],
    links: {
      demo: "https://devpost.com/software/prosperousss",
      github: "https://github.com/tetraslam/finhacks"
    },
    achievements: [
      "Won Finhacks 2024 & $1000",
      "Building it into a real product"
    ],
    category: "software",
    date: "2025-01",
    stars: 0
  },
  {
    id: "maas",
    title: "Matchaneko: Matcha as a Service",
    description: "A cat will deliver matcha to your door (trust)! Launching soon.",
    longDescription: "My friend (pookie) Lucas and I are starting a matcha-tasting subscription service, sourcing the best matcha from around the world.",
    image: "/projects/maas.png", 
    techStack: ["Matcha", "Next.js", "Tailwind"],
    links: {
      comingsoon: "https://matchaneko.co"
    },
    achievements: [
      "Advanced cat mechanics",
      "Cat-to-door delivery"
    ],
    category: "software",
    date: "2025-01",
    stars: 0
  },
  {
    id: "roami",
    title: "Roami: Your Roadtrip Companion",
    description: "Built for HackBeanpot 2025",
    longDescription: "Play geoguessr, get location-specific music recs, customized tours, travel challenges, and more!",
    image: "/projects/roami.png", 
    techStack: ["Next.js", "Tailwind", "Firebase", "Moondream", "Cerebras"],

    links: {
      demo: "https://devpost.com/software/roami"
    },
    achievements: [
      
    ],
    category: "software",
    date: "2025-02",
    stars: 0
  },
  ,
  {
    id: "perry",
    title: "Perry The Platypus???",
    description: "Make customized secret agent profiles from pics of your pet.",
    longDescription: "A fun project I built using Moondream and Cerebras for my 'building a side project a day until I get an internship' challenge.",
    image: "/projects/perry.png", 
    techStack: ["Next.js", "Tailwind", "Firebase"],
    links: {
      website: "https://perry-the-platypus.vercel.app/",
      github: "https://github.com/tetraslam/perry-the-platypus"
    },
    achievements: [
      "Fun project!",
      "Got noticed by Moondream team!"
    ],
    category: "software",
    date: "2025-02",
    stars: 0
  }
];

export async function getProjectStars(projectId: string): Promise<number> {
  try {
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().stars || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error getting project stars:', error);
    return 0;
  }
}

export async function starProject(projectId: string): Promise<void> {
  try {
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      await updateDoc(docRef, {
        stars: (docSnap.data().stars || 0) + 1
      });
    } else {
      await setDoc(docRef, {
        stars: 1
      });
    }
  } catch (error) {
    console.error('Error starring project:', error);
    throw error;
  }
}

export function sortProjects(
  projectList: Project[],
  sortBy: 'date' | 'stars' | 'title'
): Project[] {
  return [...projectList].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'stars':
        return (b.stars || 0) - (a.stars || 0);
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });
}

export function filterProjects(
  projectList: Project[],
  category?: 'software' | 'hardware' | 'research' | 'creative'
): Project[] {
  if (!category) return projectList;
  return projectList.filter(p => p.category === category);
} 