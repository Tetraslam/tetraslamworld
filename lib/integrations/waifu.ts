export interface Waifu {
  id: string;
  name: string;
  series: string;
  image: string;
  description: string;
  traits: string[];
  ranking: number;
  lastWeekRanking: number;
}

// This week's rankings - update this list manually each week
const WAIFU_RANKINGS = [
  {
    name: "Ryuuko Matoi",
    characterId: 83797,
    ranking: 1,
    lastWeekRanking: 1,
    description: "Hilariously funny and a bit of a jerk to Mako but also very caring and protective of her. 10/10 would recommend Kill La Kill.",
    traits: ["Funny", "Protective", "Just like me fr", "Overkill"]
  },
  {
    name: "Kyoko Hori",
    characterId: 66171,
    ranking: 2,
    lastWeekRanking: 2,
    description: "I LOVE HORIMIYA THIS IS MY COMFORT SHOW AND HORI IS MY COMFORT CHARACTER I WILL NEVER UNIRONICALLY WATCH SHONEN THERE IS ONLY SLICE OF LIFE AND ROMANCE AND HORIMIYA STANDS AT THE TOP OF THE HILL",
    traits: ["Adorable", "Cute", "Romantic", "Down bad"]
  },
  {
    name: "Mai Sakurajima",
    characterId: 127222,
    ranking: 3,
    lastWeekRanking: 3,
    description: "Mai fans rise up (new season of bunny girl senpai in 2025 lfg)",
    traits: ["Adorable", "Older Woman™️", "Level-headed", "Best girl"]
  },
  {
    name: "Yuki Suou",
    characterId: 243404,
    ranking: 4,
    lastWeekRanking: 4,
    description: "She was too strong so they gave her the imouto debuff",
    traits: ["Schemer", "Imouto", "Better than alya", "Best girl"]
  },
  {
    name: "Holo",
    characterId: 7373,
    ranking: 5,
    lastWeekRanking: 5,
    description: "Holo is the best girl we all love holo all hail wheat fields",
    traits: ["Intelligent", "Like really smart", "Foxgirl", "Literal goddess"]
  }
];

interface MediaEdge {
  node: {
    title: {
      romaji: string;
    };
    type: string;
    format: string;
    popularity: number;
  };
  characterRole: string;
}

interface CharacterData {
  id: number;
  name: {
    full: string;
  };
  image: {
    large: string;
  };
  description: string | null;
  media: {
    edges: MediaEdge[];
  };
}

async function fetchCharacterData(characterId: number): Promise<CharacterData | null> {
  const query = `
    query ($id: Int) {
      Character(id: $id) {
        id
        name {
          full
        }
        image {
          large
        }
        description
        media(sort: POPULARITY_DESC, type: ANIME) {
          edges {
            node {
              title {
                romaji
              }
              type
              format
              popularity
            }
            characterRole
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { id: characterId }
      })
    });

    const { data } = await response.json();
    return data.Character;
  } catch (error) {
    console.error(`Failed to fetch character data for ID ${characterId}:`, error);
    return null;
  }
}

export async function getWaifuRankings(): Promise<Waifu[]> {
  // Fetch all character data in parallel
  const waifusWithData = await Promise.all(
    WAIFU_RANKINGS.map(async (ranking) => {
      const characterData = await fetchCharacterData(ranking.characterId);
      
      if (!characterData) {
        return null;
      }

      // Find the most relevant series (prioritize MAIN roles and TV/MOVIE formats)
      const mainSeries = characterData.media.edges.find((edge: MediaEdge) => 
        edge.characterRole === 'MAIN' && 
        (edge.node.format === 'TV' || edge.node.format === 'MOVIE')
      );

      // Fallback to the most popular series if no main role found
      const series = mainSeries || characterData.media.edges[0];

      return {
        id: characterData.id.toString(),
        name: characterData.name.full,
        series: series?.node.title.romaji || 'Unknown Series',
        image: characterData.image.large,
        description: ranking.description || 'No description available.',
        traits: ranking.traits,
        ranking: ranking.ranking,
        lastWeekRanking: ranking.lastWeekRanking
      };
    })
  );
  
  // Filter out any failed fetches and return the results
  return waifusWithData.filter((waifu): waifu is Waifu => waifu !== null);
}

export function getRankingChange(current: number, previous: number): number {
  return previous - current;
}

export function getRankingChangeText(change: number): string {
  if (change > 0) return `↑${change}`;
  if (change < 0) return `↓${Math.abs(change)}`;
  return "―";
}

export function getRankingChangeClass(change: number): string {
  if (change > 0) return "text-[#4CAF50]"; // Green for improvement
  if (change < 0) return "text-[#F44336]"; // Red for decline
  return "text-foreground/60"; // Neutral
} 