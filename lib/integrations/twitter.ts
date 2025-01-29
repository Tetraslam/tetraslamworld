import { parse } from 'node-html-parser';

export interface Tweet {
  id: string;
  text: string;
  timestamp: string;
  likes: number;
  retweets: number;
}

export async function getLatestTweets(username: string, count: number = 5): Promise<Tweet[]> {
  try {
    // Using nitter.net as an alternative to Twitter's API
    const response = await fetch(`https://nitter.net/${username}`);
    const html = await response.text();
    const root = parse(html);
    
    const tweets: Tweet[] = [];
    const tweetElements = root.querySelectorAll('.timeline-item');
    
    for (let i = 0; i < Math.min(count, tweetElements.length); i++) {
      const tweet = tweetElements[i];
      const tweetId = tweet.getAttribute('data-tweet-id') || '';
      const tweetText = tweet.querySelector('.tweet-content')?.text || '';
      const timestamp = tweet.querySelector('.tweet-date')?.text || '';
      const likes = parseInt(tweet.querySelector('.tweet-stats .icon-heart')?.text || '0');
      const retweets = parseInt(tweet.querySelector('.tweet-stats .icon-retweet')?.text || '0');
      
      tweets.push({
        id: tweetId,
        text: tweetText,
        timestamp,
        likes,
        retweets
      });
    }
    
    return tweets;
  } catch (error) {
    console.error('Error fetching tweets:', error);
    return [];
  }
} 