'use client';

import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const TravelMap = dynamic(() => import("@/components/ui/travel-map").then((mod) => mod.TravelMap), { ssr: false });


export default function TravelPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl font-bold mb-4">Travel Map</h1>
          <p className="text-xl text-muted-foreground">
            Explore the places I&apos;ve visited, the people I&apos;ve met, and the experiences I&apos;ve had
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card/50 backdrop-blur-sm border border-border rounded-sm p-8"
        >
          <div className="prose prose-invert max-w-none mb-8">
            <p className="text-muted-foreground text-center">
              Click on markers to learn more about each location. Dashed lines show travel paths.
            </p>
          </div>

          <TravelMap />
        </motion.div>
      </div>
    </main>
  );
} 