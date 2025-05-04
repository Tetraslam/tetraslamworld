import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support – Shresht Bhowmick',
  description: 'Ways to support, collaborate or contact Shresht.',
  openGraph: {
    title: 'Support – Shresht Bhowmick',
    description: 'Buy a coffee, connect on social media, and more.',
    type: 'website',
  }
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children;
} 