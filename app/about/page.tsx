'use client';

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { AutoScrollGallery } from "@/components/ui/auto-scroll-gallery";

const NeuralNetwork = dynamic(() => import("@/components/ui/neural-network").then((mod) => mod.NeuralNetwork), { ssr: false });


export default function AboutPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl font-bold mb-4">About Me</h1>
          <p className="text-xl text-muted-foreground">
            Explore my interests and connections through this interactive network
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-sm p-8 mb-12"
        >
          <div className="prose prose-invert max-w-none mb-8">
            <p className="text-muted-foreground">
              Click and drag nodes to explore. Click on a node to learn more about that aspect of my life.
            </p>
          </div>

          <NeuralNetwork />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-sm p-8"
        >
          <div className="prose prose-invert max-w-none mb-8">
            <h2 className="text-2xl font-bold">Photo Gallery</h2>
            <p className="text-muted-foreground">
              moo
            </p>
          </div>
          
          <AutoScrollGallery speed={1} />
        </motion.div>
      </div>
    </main>
  );
} 