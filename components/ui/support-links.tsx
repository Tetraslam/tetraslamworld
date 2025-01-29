'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Coffee, Calendar, Github } from 'lucide-react';

const SUPPORT_LINKS = [
  {
    id: 'coffee',
    title: 'Buy Me a Coffee',
    description: 'Support my work and fuel my late-night coding sessions',
    icon: Coffee,
    href: 'https://buymeacoffee.com/tetraslam',
    color: 'text-yellow-500'
  },
  {
    id: 'calendly',
    title: 'Schedule a Chat',
    description: 'Book a time to discuss internships or collaborations',
    icon: Calendar,
    href: 'https://calendly.com/bhowmickshresht/30min',
    color: 'text-blue-500'
  },
  {
    id: 'github',
    title: 'Contribute on GitHub',
    description: 'Help improve my open-source projects',
    icon: Github,
    href: 'https://github.com/tetraslam',
    color: 'text-purple-500'
  }
];

export function SupportLinks() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {SUPPORT_LINKS.map((link, index) => {
        const Icon = link.icon;
        
        return (
          <motion.div
            key={link.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link
              href={link.href}
              target="_blank"
              className="block group"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-card/50 backdrop-blur-sm border border-border rounded-sm p-6 h-full"
              >
                {/* Pixel Art Corner Decorations */}
                <div className="relative w-full h-full">
                  <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-primary" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-primary" />
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-primary" />
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-primary" />

                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-sm bg-card flex items-center justify-center ${link.color} transition-colors group-hover:text-primary`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {link.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
} 