export interface Friend {
  id: string;
  name: string;
  avatar: string;
  role: string;
  connection: string;
  interests: string[];
  projects: {
    name: string;
    url?: string;
  }[];
  links: {
    twitter?: string;
    github?: string;
    website?: string;
    instagram?: string;
    linkedin?: string;
  };
  lastInteraction: string;
  vibeScore: number;
}

// This would typically fetch from an API, but for now we'll use mock data
const FRIENDS: Friend[] = [
  {
    id: '1',
    name: 'Sami',
    avatar: '/friends/sami.png',
    role: 'Filthy communications design student @ CEPT',
    connection: 'Best friend',
    interests: ['Graphic Design', 'Fashion', 'Art'],
    projects: [
      {
        name: "Purple Monkey (no link because she's delaying launching it)",
        url: 'https://'
      }
    ],
    links: {
      twitter: '@thehumansami',
      instagram: '@thehumansami'
    },
    lastInteraction: '2024-01-20',
    vibeScore: 98
  },
  {
    id: '2',
    name: 'William Feng',
    avatar: '/friends/bill.png',
    role: 'CS @ MIT',
    connection: 'Friend & hackathon buddy!',
    interests: ['ML', 'Full-stack', 'Physics simulations'],
    projects: [
      {
        name: 'AI-accelerated physics simulations for robotics',
        url: 'https://savaun.com'
      },
      {
        name: 'Head Soccer AI',
        url: 'https://womogenes.github.io/soccer/'
      }
    ],
    links: {
      twitter: '@_womogenes',
      website: 'https://www.wfeng.dev'
    },
    lastInteraction: '2025-01-26',
    vibeScore: 95
  },
  {
    id: '3',
    name: 'Mouad Tiahi',
    avatar: '/friends/mouad.png',
    role: 'CS @ Northeastern | MLE @ Kaeli Comp Architecture Lab | Future Quantum Computing Systems Engineer',
    connection: 'Hackathon & startup friend!',
    interests: ['NLP', 'ML', 'Quantum Computing', 'Embedded Systems'],
    projects: [
      {
        name: 'On-hardware ASL translator using reverse-engineered Kinect with a LiDAR-trained vision model',
        url: 'https://www.linkedin.com/posts/mouad-tiahi-0b361524b_deeplearning-hackmit-dataengineering-activity-7241536189705433088-GGMa'
      }
    ],
    links: {
      twitter: '@staticsoul2',
      instagram: '@muuseo_thi',
      linkedin: '@mouad-tiahi'
    },
    lastInteraction: '2025-01-18',
    vibeScore: 97
  },
  {
    id: '4',
    name: 'Xiaole Su',
    avatar: '/friends/xiaole.png',
    role: 'CS + Math @ Northeastern | Volleyball player | K-pop/hiphop dancer',
    connection: 'Hackathon friend!',
    interests: ['Game dev', 'Full-stack', 'Volleyball', 'K-pop dancer'],
    projects: [
      {
        name: 'Perennial Harvest: A web-based game inspired by Chinese folklore',
        url: 'https://waiwasabi.itch.io/perennial-harvest'
      },
      {
        name: 'KADA: An ML-based Kpop video-to-dance choreography generator',
        url: 'https://devpost.com/software/kada-kpop-advanced-dance-analyzer'
      }
    ],
    links: {
      website: 'https://xiaolesu.netlify.app',
      linkedin: '@xiaolesu',
      instagram: '@xxiaole.su'
    },
    lastInteraction: '2024-01-22',
    vibeScore: 96
  },
  {
    id: '5',
    name: 'Lucas Sta Maria',
    avatar: '/friends/lucas.png',
    role: 'CS @ Northeastern | SWE @ Agency.inc',
    connection: 'Pookie & hackathon buddy!',
    interests: ['Compilers', 'DSLs', 'NixOS', 'Kim Minji Fanboy', 'Matcha Enthusiast'],
    projects: [
      {
        name: 'NixOS and Emacs config',
        url: 'https://github.com/priime0/dotfiles'
      }
    ],
    links: {
      github: 'priime0',
      website: 'https://priime.dev'
    },
    lastInteraction: '2025-01-19',
    vibeScore: 94
  },
  {
    id: '6',
    name: 'Yoyo Yuan',
    avatar: '/friends/yoyo.png',
    role: 'CS & Neuroscience @ Minerva',
    connection: 'Co-founder!',
    interests: ['Brain-computer interfaces', 'Neuroscience', 'ML', 'Applied math'],
    projects: [
      {
        name: 'Research on Quantum Simulation System: Ultracold Atom Simulation and Integrated Photonic Simulation',
        url: 'https://ieeexplore.ieee.org/abstract/document/10079020'
      }
    ],
    links: {
      github: 'exanova-y',
      twitter: '@indiraschka',
      website: 'https://exanova.mmm.page'
    },
    lastInteraction: '2025-01-19',
    vibeScore: 94
  },
  {
    id: '7',
    name: 'Arav Kumar',
    avatar: '/friends/arav.png',
    role: 'CS @ Northeastern | ML @ Oakridge National Lab | Ex-Quant Researcher',
    connection: 'Startup buddy!',
    interests: ['ML', 'Quant Trading', 'Startups', 'LLM Research'],
    projects: [
      {
        name: 'Whitebox AI: natural language data cleaning',
        url: 'https://x.com/AI_Arav/status/1809700233133113617'
      }
    ],
    links: {
      github: 'a-ravioli',
      twitter: '@indiraschka',
      website: 'https://exanova.mmm.page/'
    },
    lastInteraction: '2025-01-19',
    vibeScore: 94
  },
  {
    id: '8',
    name: 'Bensen Wang',
    avatar: '/friends/bensen.png',
    role: 'CS @ Northeastern | Visual Novel Developer and Enthusiast | Northeastern Robotics',
    connection: 'Best friend & dormmate!',
    interests: ['Robotics', 'Visual Novels', 'ML', 'Anime', 'Yu-Gi-Oh!'],
    projects: [
    ],
    links: {
      instagram: '@bensenwang8'
    },
    lastInteraction: '2025-01-19',
    vibeScore: 94
  },
  {
    id: '9',
    name: 'Sophia Fu',
    avatar: '/friends/sophia.png',
    role: 'CS @ Northeastern',
    connection: 'Best friend & dormmate!',
    interests: ['Full-stack', 'Data Visualization', 'Nail Art', 'Music'],
    projects: [
      {
        name: 'Wardrobe Wizard',
        url: 'https://www.linkedin.com/posts/tranganh-nguyen_today-was-our-demo-day-for-the-oasis-project-ugcPost-7182856990673510400-ahVI'
      },
      {
        name: 'ProsperouSSS: A Financial Digital Twin Software (1st place @ Finhacks 2025)',
        url: 'https://devpost.com/software/prosperousss'
      }
    ],
    links: {
      instagram: '@sssoph1af',
      github: 'sf0628',
      website: 'https://sf0628.github.io'
    },
    lastInteraction: '2025-01-19',
    vibeScore: 94
  },
  {
    id: '10',
    name: 'Prajwal Reddy',
    avatar: '/friends/prajwal.png',
    role: 'CS & Econ @ Cornell',
    connection: 'Best friend!',
    interests: ['Compilers', 'Linguistics', 'Urban Planning', 'Econometrics', 'Conlanging'],
    projects: [
      {
        name: 'Pulsar: A General-Purpose Language for Compiled And Interpreted Environments',
        url: 'https://github.com/PrajwalMReddy/Pulsar'
      },
      {
        name: 'MIDILang: Music DSL',
        url: 'https://github.com/PrajwalMReddy/MIDILang'
      },
      {
        name: 'Conducting Sentiment Analysis on Twitter Tweets to Predict the Outcomes of the Upcoming Karnataka State Elections',
        url: 'https://www.internationaljournalssrg.org/IJCSE/paper-details?Id=499'
      },
      {
        name: 'KannadaDisco: Kannada Learning App',
        url: 'https://kannadadisco.com/'
      }
    ],
    links: {
      github: 'prajwalmreddy',
      website: 'https://prajwalmreddy.com',
      linkedin: '@prajwalmreddy'
    },
    lastInteraction: '2025-01-19',
    vibeScore: 94
  },
  {
    id: '11',
    name: 'Aaron Tang',
    avatar: '/friends/aaron.png',
    role: 'Industrial Designer | Ex-RISD, Harvard, MIT, Sony, Siemens, TED | Angel Investor',
    connection: 'Startup friend',
    interests: ['Design', 'AI', 'Smart Cities', 'Investing'],
    projects: [
    ],
    links: {
      twitter: '@hahatango',
      website: 'https://www.hahatango.com/',
      linkedin: '@hahatango'
    },
    lastInteraction: '2025-01-19',
    vibeScore: 94
  },
  {
    id: '12',
    name: 'Dunya Baradari',
    avatar: '/friends/dunya.png',
    role: 'PhD Student @ MIT Media Lab | Founder, Augmentation Lab | Resident @ Cyborg House',
    connection: 'Research Collaborator & Startup friend',
    interests: ['Digital Twins', 'ML', 'Biomimetic Robotics', 'Startups'],
    projects: [
    ],
    links: {
      twitter: '@Dunya8a',
      website: 'https://www.dunya-baradari.com/',
      linkedin: '@dunyab'
    },
    lastInteraction: '2025-01-19',
    vibeScore: 94
  },
  {
    id: '13',
    name: 'Shruti Karandikar',
    avatar: '/friends/shruti.png',
    role: 'Astrophysics @ ?',
    connection: 'Friend',
    interests: ['Physics', 'Math', 'Astronomy', 'Art'],
    projects: [
    ],

    links: {
      instagram: '@shrutiisnotshruti',
      website: 'https://shruti.karandikar.org/'
    },
    lastInteraction: '2025-01-19',
    vibeScore: 94
  },
  {
    id: '14',
    name: 'Tyler Dong',
    avatar: '/friends/tyler.png',
    role: 'CS & CE @ Northeastern',
    connection: 'Friend & dormmate!',
    interests: ['EE', 'Game dev', 'ML'],
    projects: [
      {
        name: 'SVS Lunar Client (Boston Hacks 1st Place)',
        url: 'https://devpost.com/software/jtr'
      }
    ],
    links: {
      instagram: '@tylerdong_'
    },
    lastInteraction: '2025-01-19',
    vibeScore: 94
  }
];


export async function getFriends(): Promise<Friend[]> {
  // In a real implementation, this would fetch from an API
  return FRIENDS;
}

export function getFriendsByInterest(interest: string): Friend[] {
  return FRIENDS.filter(friend => 
    friend.interests.some(i => i.toLowerCase().includes(interest.toLowerCase()))
  );
}

export function getFriendsByVibeScore(minScore: number): Friend[] {
  return FRIENDS.filter(friend => friend.vibeScore >= minScore);
}

export function getRecentlyInteractedFriends(days: number = 7): Friend[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  return FRIENDS.filter(friend => 
    new Date(friend.lastInteraction) >= cutoff
  );
}

export function getSharedProjectCount(friendId: string): number {
  const friend = FRIENDS.find(f => f.id === friendId);
  return friend?.projects.length || 0;
} 