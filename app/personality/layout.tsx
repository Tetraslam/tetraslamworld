import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Personality – Shresht Bhowmick',
  description: "Dive into Shresht's random thoughts, waifu rankings, decision trees, and travel map – an eccentric window into his mind.",
  openGraph: {
    title: 'Personality – Shresht Bhowmick',
    description: 'Random thoughts, waifu rankings, quizzes, and more.',
    type: 'website',
  }
};

export default function PersonalityLayout({ children }: { children: React.ReactNode }) {
  return children;
} 