'use client';

import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const SupportLinks = dynamic(() => import("@/components/ui/support-links").then((mod) => mod.SupportLinks), { ssr: false });

import Link from "next/link";

export default function SupportPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header Section */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h1 className="text-4xl font-bold mb-4">Support & Connect</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Whether you want to support my work, discuss opportunities, or contribute to my projects,
              here&apos;s how you can get involved.
            </p>
          </motion.div>
        </section>

        {/* Support Links Section */}
        <section>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <SupportLinks />
          </motion.div>
        </section>

        {/* Additional Info Section */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-2xl font-bold mb-4">Other Ways to Connect</h2>
            <p className="text-muted-foreground mb-6">
              You can also find me on various platforms where I share my work, thoughts, and experiences.
              Feel free to reach out!
            </p>
            <div className="prose prose-invert max-w-none">
              <ul className="list-none p-0 space-y-2">
                <li><Link
              href="https://x.com/tetraslam"
              target="_blank"
              className="block group"
            >
                  <span className="text-primary">Email:</span>{' '}
                  I usually reply quickly :D
                </Link></li>
                <li><Link

              href="mailto:shresht@mit.edu"
              target="_blank"
              className="block group"
            >
                  <span className="text-primary">Twitter:</span>{' '}
                  Regular updates and tech discussions
                </Link></li>
                <li><Link
              href="https://blog.tetraslam.world"
              target="_blank"
              className="block group"
            >
                  <span className="text-primary">Blog:</span>{' '}
                  In-depth articles about my projects and research
                </Link></li>
                <li><Link
              href="https://github.com/tetraslam"
              target="_blank"
              className="block group"
            >
                  <span className="text-primary">GitHub:</span>{' '}
                  Open-source contributions and personal projects
                </Link></li>
              </ul>
            </div>
          </motion.div>
        </section>

        {/* Pixel Art Footer Decoration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center"
        >
          <div className="w-32 h-8 relative">
            <div className="absolute inset-0 border-2 border-primary opacity-20" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 border-2 border-primary transform rotate-45" />
          </div>
        </motion.div>
      </div>
    </main>
  );
} 