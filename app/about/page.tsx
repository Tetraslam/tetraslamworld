'use client';

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { AutoScrollGallery } from "@/components/ui/auto-scroll-gallery";
import Link from 'next/link';

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

        {/* Uses Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-card border border-border rounded-sm p-8 mt-12"
        >
          <div className="prose prose-invert max-w-none mb-8">
            <h2 className="text-2xl font-bold">Uses</h2>
            <p className="text-muted-foreground">Hardware, software & daily drivers that power my workflow.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 text-sm">
            <ul className="space-y-1">
              <li><span className="font-semibold text-primary">Laptop:</span> ASUS ROG Zephyrus G16 (RTX 4080)</li>
              <li><span className="font-semibold text-primary">Desktop:</span> Soon</li>
              <li><span className="font-semibold text-primary">Editor:</span> Helix & Cursor</li>
              <li><span className="font-semibold text-primary">Terminal:</span> Windows Terminal</li>
              <li><span className="font-semibold text-primary">Shell:</span> Nushell</li>
              <li><span className="font-semibold text-primary">Phone:</span> Samsung Galaxy Z Flip 5</li>
            </ul>

            <ul className="space-y-1">
              <li><span className="font-semibold text-primary">Languages:</span> Python, Zig, TypeScript, Nim</li>
              <li><span className="font-semibold text-primary">Frameworks:</span> Next.js, FastAPI, Tailwind, DearPyGui</li>
              <li><span className="font-semibold text-primary">ML Stack:</span> PyTorch, CUDA, Triton, tinygrad</li>
              <li><span className="font-semibold text-primary">Design:</span> Figma, Canva, Penpot</li>
              <li><span className="font-semibold text-primary">Notes:</span> Notion</li>
              <li><span className="font-semibold text-primary">Misc:</span> Supabase, Godot, PostHog</li>
            </ul>
          </div>
        </motion.div>

        {/* Media Mentions Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-card border border-border rounded-sm p-8 mt-12"
        >
          <div className="prose prose-invert max-w-none mb-8">
            <h2 className="text-2xl font-bold">Media & Talks</h2>
            <p className="text-muted-foreground">A few spots where my work has popped up.</p>
          </div>

          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-2">
              <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-primary mt-1" />
              <div>
                <Link href="https://www.khoury.northeastern.edu/fintech-themed-hackathon-gives-computing-beginners-and-veterans-a-chance-to-shine/" target="_blank" className="underline text-primary hover:text-accent">“Fintech-themed hackathon gives computing beginners and veterans a chance to shine" - Khoury News</Link>
                <p className="text-xs text-muted-foreground">March 2025</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-primary mt-1" />
              <div>
                <Link href="https://youtu.be/L5FGr2gRYZ8" target="_blank" className="underline text-primary hover:text-accent">A Turing-Complete Fractal-Musical Language | Shresht Bhowmick & Arnav Dave @ MIT Media Lab</Link>
                <p className="text-xs text-muted-foreground">November 2024</p>
              </div>
            </li>
          </ul>
        </motion.div>
      </div>
    </main>
  );
} 