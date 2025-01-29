'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Tweet, getLatestTweets } from '@/lib/integrations/twitter';
import { BlogPost, getBlogPosts } from '@/lib/integrations/blog';
import { SpotifyTrack, initSpotifyEmbed, createSpotifyEmbed } from '@/lib/integrations/spotify';
import { LeaderboardEntry, getLeaderboard } from '@/lib/integrations/leaderboard';

export function DynamicContent() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch tweets
      const latestTweets = await getLatestTweets('tetraslam', 3);
      setTweets(latestTweets);

      // Fetch blog posts
      const posts = await getBlogPosts(3);
      setBlogPosts(posts);

      // Initialize Spotify embed
      await initSpotifyEmbed();
      createSpotifyEmbed('spotify-embed', 'spotify:user:tetraslam');

      // Fetch leaderboard
      const scores = await getLeaderboard(5);
      setLeaderboard(scores);
    };

    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
      {/* Twitter Feed */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-card/50 backdrop-blur-sm border border-border rounded-sm p-6"
      >
        <h2 className="text-2xl font-bold mb-4">Latest Tweets</h2>
        <div className="space-y-4">
          {tweets.map((tweet) => (
            <div key={tweet.id} className="border-b border-border pb-4">
              <p className="text-sm text-muted-foreground">{tweet.text}</p>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span>{tweet.timestamp}</span>
                <span>♥ {tweet.likes}</span>
                <span>↺ {tweet.retweets}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Blog Posts */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-card/50 backdrop-blur-sm border border-border rounded-sm p-6"
      >
        <h2 className="text-2xl font-bold mb-4">Latest Blog Posts</h2>
        <div className="space-y-4">
          {blogPosts.map((post) => (
            <div key={post.id} className="border-b border-border pb-4">
              <h3 className="text-lg font-semibold">{post.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{post.date}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Spotify Player */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-card/50 backdrop-blur-sm border border-border rounded-sm p-6"
      >
        <h2 className="text-2xl font-bold mb-4">Now Playing</h2>
        <div id="spotify-embed" className="w-full h-[152px]" />
      </motion.section>

      {/* Roguelike Leaderboard */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-card/50 backdrop-blur-sm border border-border rounded-sm p-6"
      >
        <h2 className="text-2xl font-bold mb-4">Roguelike Leaderboard</h2>
        <div className="space-y-4">
          {leaderboard.map((entry) => (
            <div key={entry.id} className="border-b border-border pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{entry.playerName}</h3>
                  <p className="text-sm text-muted-foreground">
                    Level {entry.level} {entry.character}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{entry.score}</p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
} 