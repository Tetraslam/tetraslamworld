'use client';

import { motion } from "framer-motion";
import dynamic from "next/dynamic";


// Dynamically import client-only components with correct type handling
const DecisionTree = dynamic(() => import("@/components/ui/decision-tree").then((mod) => mod.DecisionTree), { ssr: false });
const TravelMap = dynamic(() => import("@/components/ui/travel-map").then((mod) => mod.TravelMap), { ssr: false });
const ThoughtGenerator = dynamic(() => import("@/components/ui/thought-generator").then((mod) => mod.ThoughtGenerator), { ssr: false });
const WaifuRankings = dynamic(() => import("@/components/ui/waifu-rankings").then((mod) => mod.WaifuRankings), { ssr: false });
const Oomfboard = dynamic(() => import("@/components/ui/oomfboard").then((mod) => mod.Oomfboard), { ssr: false });


export default function PersonalityPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Random Thought Generator Section */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h1 className="text-4xl font-bold mb-4">Random Thoughts</h1>
            <p className="text-xl text-muted-foreground">
              Showerthoughts and things my friends think I say often - filtered by category or mood
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <ThoughtGenerator />
          </motion.div>
        </section>

        {/* Waifu Rankings Section */}
        <section className="relative space-y-6">
          <div className="relative">
            <h2 className="text-2xl font-pixel text-primary mb-3">Monthly Anime Character Rankings</h2>
            <p className="text-foreground/80">
              My current top picks from seasonal anime/manga and the ones I'm watching/reading right now.
            </p>
          </div>
          <div className="relative z-0">
            <WaifuRankings />
          </div>
        </section>

        {/* Oomfboard Section */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h2 className="text-4xl font-bold mb-4">Oomfs</h2>
            <p className="text-xl text-muted-foreground">
              Cool people I've met along the way - filtered by interests
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Oomfboard />
          </motion.div>
        </section>

        {/* Decision Tree Section */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h2 className="text-4xl font-bold mb-4">What Would Shresht Do?</h2>
            <p className="text-xl text-muted-foreground">
              Navigate through different scenarios and see what I would pick.
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
                Choose your path through the decision tree!
              </p>
            </div>

            <DecisionTree />
          </motion.div>
        </section>

        {/* Travel Map Section */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h2 className="text-4xl font-bold mb-4">My Travel Map :)</h2>
            <p className="text-xl text-muted-foreground">
              Explore the places I've visited, the people I've met, and the experiences I've had
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
                Click &apos;Generate New Thought&apos; to see what&apos;s on my mind
              </p>
            </div>

            <TravelMap />
          </motion.div>
        </section>
      </div>
    </main>
  );
}
