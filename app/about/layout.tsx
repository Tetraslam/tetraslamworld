import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About – Shresht Bhowmick',
  description: 'Explore my interests and connections through Shresht\'s interactive neural network and photo gallery.',
  openGraph: {
    title: 'About – Shresht Bhowmick',
    description: 'Interactive network of interests, connections, and a fun scrolling gallery.',
    type: 'website',
  }
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
} 