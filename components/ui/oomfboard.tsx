'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import * as HoverCard from '@radix-ui/react-hover-card';
import { Friend, getFriends, getFriendsByInterest, getFriendsByVibeScore } from '@/lib/integrations/oomfboard';

type FilterType = 'all' | 'interest' | 'vibe';

export function Oomfboard() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [expandedFriendId, setExpandedFriendId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [filter, setFilter] = useState<{
    type: FilterType;
    value: string;
  }>({ type: 'all', value: '' });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchFriends = async () => {
      let friendsList: Friend[];
      
      switch (filter.type) {
        case 'interest':
          friendsList = getFriendsByInterest(filter.value);
          break;
        case 'vibe':
          friendsList = getFriendsByVibeScore(parseInt(filter.value));
          break;
        default:
          friendsList = await getFriends();
      }
      
      setFriends(friendsList);
    };
    
    fetchFriends();
  }, [filter]);

  const allInterests = Array.from(
    new Set(
      friends.flatMap(friend => friend.interests)
    )
  ).sort();

  const handleInteraction = (friendId: string) => {
    if (isMobile) {
      setExpandedFriendId(expandedFriendId === friendId ? null : friendId);
    }
  };

  const renderFriendContent = (friend: Friend) => (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="relative w-24 h-24 rounded-sm overflow-hidden">
          <Image
            src={friend.avatar}
            alt={friend.name}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <h4 className="font-semibold text-lg">{friend.name}</h4>
          <p className="text-sm text-muted-foreground">
            {friend.role}
          </p>
          <p className="text-sm mt-2">
            {friend.connection}
          </p>
        </div>
      </div>

      <div>
        <h5 className="font-medium mb-2">Interests</h5>
        <div className="flex flex-wrap gap-2">
          {friend.interests.map((interest) => (
            <span
              key={interest}
              className="text-xs px-2 py-1 bg-muted rounded-sm"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h5 className="font-medium mb-2">Projects</h5>
        <ul className="space-y-1">
          {friend.projects.map((project) => (
            <li key={project.name}>
              {project.url ? (
                <Link
                  href={project.url}
                  className="text-sm text-primary hover:underline"
                  target="_blank"
                >
                  {project.name}
                </Link>
              ) : (
                <span className="text-sm">{project.name}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        {friend.links.twitter && (
          <Link
            href={`https://twitter.com/${friend.links.twitter.replace('@', '')}`}
            className="text-sm text-primary hover:underline"
            target="_blank"
          >
            {friend.links.twitter}
          </Link>
        )}
        {friend.links.github && (
          <Link
            href={`https://github.com/${friend.links.github}`}
            className="text-sm text-primary hover:underline"
            target="_blank"
          >
            @{friend.links.github}
          </Link>
        )}
        {friend.links.website && (
          <Link
            href={friend.links.website.startsWith('http') ? friend.links.website : `https://${friend.links.website}`}
            className="text-sm text-primary hover:underline"
            target="_blank"
          >
            {friend.links.website.replace(/^https?:\/\//, '')}
          </Link>
        )}
        {friend.links.instagram && (
          <Link
            href={`https://instagram.com/${friend.links.instagram.replace('@', '')}`}
            className="text-sm text-primary hover:underline"
            target="_blank"
          >
            {friend.links.instagram}
          </Link>
        )}
        {friend.links.linkedin && (
          <Link
            href={`https://linkedin.com/in/${friend.links.linkedin.replace('@', '')}`}
            className="text-sm text-primary hover:underline"
            target="_blank"
          >
            {friend.links.linkedin}
          </Link>
        )}
      </div>
    </div>
  );

  const renderFriendCard = (friend: Friend, index: number) => {
    const isExpanded = expandedFriendId === friend.id;
    const baseCard = (
      <div className="flex items-start gap-4">
        <div className="relative w-16 h-16 rounded-sm overflow-hidden">
          <Image
            src={friend.avatar}
            alt={friend.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-grow">
          <h3 className="font-semibold text-lg">{friend.name}</h3>
          <p className="text-sm text-muted-foreground mb-2">
            {friend.role}
          </p>
          <div className="flex flex-wrap gap-2">
            {friend.interests.slice(0, 3).map((interest) => (
              <span
                key={interest}
                className="text-xs px-2 py-1 bg-muted rounded-sm"
              >
                {interest}
              </span>
            ))}
            {friend.interests.length > 2 && (
              <span className="text-xs px-2 py-1 bg-muted rounded-sm">
                +{friend.interests.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
    );

    if (isMobile) {
      return (
        <motion.div
          key={friend.id}
          layout
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{
            duration: 0.3,
            delay: index * 0.1,
            layout: { duration: 0.3 }
          }}
          className="relative"
        >
          <div 
            onClick={() => handleInteraction(friend.id)}
            className="bg-card/50 backdrop-blur-sm border border-border rounded-sm p-6 cursor-pointer hover:bg-card/60 transition-colors duration-300"
          >
            {baseCard}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 pt-6 border-t border-border"
                >
                  {renderFriendContent(friend)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        key={friend.id}
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{
          duration: 0.3,
          delay: index * 0.1,
          layout: { duration: 0.3 }
        }}
      >
        <HoverCard.Root>
          <HoverCard.Trigger asChild>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-sm p-6 cursor-pointer hover:bg-card/60 transition-colors duration-300">
              {baseCard}
            </div>
          </HoverCard.Trigger>
          <HoverCard.Portal>
            <HoverCard.Content
              className="bg-popover text-popover-foreground p-6 rounded-sm border border-border shadow-lg w-96"
              sideOffset={5}
            >
              {renderFriendContent(friend)}
              <HoverCard.Arrow className="fill-border" />
            </HoverCard.Content>
          </HoverCard.Portal>
        </HoverCard.Root>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          className="bg-background border border-border rounded-sm px-3 py-2 text-sm"
          onChange={(e) => {
            const [type, value] = e.target.value.split(':');
            setFilter({ type: type as FilterType, value: value || '' });
          }}
          value={`${filter.type}:${filter.value}`}
        >
          <option value="all:">All Friends</option>
          <optgroup label="By Interest">
            {allInterests.map(interest => (
              <option key={interest} value={`interest:${interest}`}>
                {interest}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Friend Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {friends.map((friend, index) => renderFriendCard(friend, index))}
        </AnimatePresence>
      </div>
    </div>
  );
} 