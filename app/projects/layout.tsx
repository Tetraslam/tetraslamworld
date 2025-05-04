import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Projects – Shresht Bhowmick',
  description: 'Browse a curated collection of software, research, and creative projects by Shresht.',
  openGraph: {
    title: 'Projects – Shresht Bhowmick',
    description: 'Explore software, hardware, research and creative work with filters and details.',
    type: 'website',
  }
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
} 