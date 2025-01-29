interface WaifuData {
  images: string[];
  names: string[];
  lastUpdated: number;
}

const CACHE_KEY = 'waifu_rankings_cache';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export async function getWeeklyWaifus(): Promise<{ images: string[], names: string[] }> {
  // Check cache first
  const cachedData = localStorage.getItem(CACHE_KEY);
  if (cachedData) {
    const data: WaifuData = JSON.parse(cachedData);
    const now = Date.now();
    
    // If cache is still valid (less than 7 days old)
    if (now - data.lastUpdated < CACHE_DURATION) {
      console.log('Using cached waifu rankings');
      return {
        images: data.images,
        names: data.names,
        
      };
    }
  }

  // If no cache or cache is expired, fetch new data
  try {
    console.log('Fetching fresh waifu rankings');
    const response = await fetch('https://api.waifu.pics/many/sfw/waifu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ exclude: [] }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch waifu data');
    }

    const data = await response.json();
    const images = data.files.slice(0, 5); // Get top 5 waifus
    const names = [
      'Makima (Chainsaw Man)',
      'Yor Forger (Spy x Family)',
      'Marin Kitagawa (My Dress-Up Darling)',
      'Power (Chainsaw Man)',
      'Chisato Nishikigi (Lycoris Recoil)'
    ];

    // Cache the new data
    const cacheData: WaifuData = {
      images,
      names,
      lastUpdated: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

    return { images, names };
  } catch (error) {
    console.error('Error fetching waifu data:', error);
    
    // If fetch fails and we have cached data (even if expired), use it as fallback
    if (cachedData) {
      console.log('Using expired cache as fallback');
      const data: WaifuData = JSON.parse(cachedData);
      return {
        images: data.images,
        names: data.names
      };
    }
    
    // If all else fails, return empty arrays
    return { images: [], names: [] };
  }
} 