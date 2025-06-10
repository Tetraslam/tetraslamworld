import { Metadata } from 'next';
import VendingMachine from '@/components/client/VendingMachine';

export const metadata: Metadata = {
  title: 'Digital Vending Machine – Shresht Bhowmick',
  description: 'Retro-futuristic vending machine dispensing digital goods, zines, and mystical artifacts.',
};

export default function VendingPage() {
  return (
    <main className="min-h-screen p-4 md:p-8 overflow-hidden">
      <VendingMachine />
    </main>
  );
} 