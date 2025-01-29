export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  level: number;
  character: string;
  timestamp: string;
}

// This is a placeholder implementation. In a real application,
// you would need to set up a proper backend API to store and retrieve scores.
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: '1',
    playerName: 'tetraslam',
    score: 10000,
    level: 42,
    character: 'Wizard',
    timestamp: new Date().toISOString()
  },
  {
    id: '2',
    playerName: 'player2',
    score: 8500,
    level: 38,
    character: 'Rogue',
    timestamp: new Date().toISOString()
  },
  {
    id: '3',
    playerName: 'player3',
    score: 7200,
    level: 35,
    character: 'Warrior',
    timestamp: new Date().toISOString()
  }
];

export async function getLeaderboard(count: number = 10): Promise<LeaderboardEntry[]> {
  try {
    // In a real implementation, this would fetch from an API
    return MOCK_LEADERBOARD.slice(0, count);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

export async function submitScore(entry: Omit<LeaderboardEntry, 'id' | 'timestamp'>): Promise<boolean> {
  try {
    // In a real implementation, this would submit to an API
    console.log('Score submitted:', entry);
    return true;
  } catch (error) {
    console.error('Error submitting score:', error);
    return false;
  }
} 