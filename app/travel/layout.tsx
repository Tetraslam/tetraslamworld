import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Travel – Shresht Bhowmick',
  description: 'Interactive map of places Shresht has visited and experiences on his journeys.',
  openGraph: {
    title: 'Travel – Shresht Bhowmick',
    description: 'Interactive travel map with stories, activities and connections.',
    type: 'website',
  }
};

export default function TravelLayout({ children }: { children: React.ReactNode }) {
  return children;
} 