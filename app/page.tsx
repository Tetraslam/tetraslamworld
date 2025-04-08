'use client';

import { motion } from "framer-motion";
import { projects } from "@/lib/project-data";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from 'react';
import { animate, stagger, createScope, createSpring } from 'animejs';
import type { TargetsParam } from 'animejs';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const featuredProjects = [
  projects.find(p => p.id === "lagrangiansubmanifolds"),
  projects.find(p => p.id === "medialab"),
  projects.find(p => p.id === "maas"),
].filter(Boolean);

export default function Home() {
  const scope = useRef<ReturnType<typeof createScope> | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null); // Ref for the content group

  useEffect(() => {
    const titleElement = titleRef.current;
    const portraitElement = portraitRef.current;

    // Ensure elements exist before attempting animation
    if (!titleElement || !portraitElement) {
      return;
    }

    // Type assertion for querySelectorAll, assuming spans exist if titleElement exists
    const titleSpans = titleElement.querySelectorAll('span');

    scope.current = createScope({ root: document.body }).add(() => {
      // Title Reveal Animation
      animate(titleSpans as unknown as TargetsParam, {
        opacity: [0, 1],
        translateY: [20, 0],
        scale: [0.8, 1],
        delay: stagger(50, { start: 600 }),
        ease: createSpring({ stiffness: 150, damping: 15 })
      });

      // Portrait Pixel Assembly (Circular reveal)
      animate(portraitElement, {
        opacity: [0, 1],
        scale: [0.9, 1],
        clipPath: [
          'circle(0% at 50% 50%)',   // Start as a point
          'circle(70.7% at 50% 50%)' // Expand to encompass the square (sqrt(0.5) approx 70.7%)
        ],
        delay: 100,
        duration: 1000,
        ease: 'out(3)'
      });

      // Portrait Bobbing Idle Animation
      animate(portraitElement, {
        translateY: ['0px', '-8px', '0px'],
        loop: true,
        delay: 1100,
        duration: 3500,
        ease: 'inOutSine'
      });
    });

    return () => scope.current?.revert();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Content container for centering */}
        <div className="flex flex-col items-center w-full max-w-3xl">
          {/* Portrait image moved above text */}
          <motion.div
            ref={portraitRef}
            className="w-32 h-32 md:w-48 md:h-48 z-10 opacity-0 mb-8" // Base container for size, position, animation
            style={{ imageRendering: 'pixelated' }}
          >
            {/* Wrapper for animated border */}
            <div className="relative w-full h-full p-[2px] rounded-full orbiting-border">
              {/* Div for background color, shadow, shape */}
              <div className="w-full h-full rounded-full bg-background shadow-inner shadow-[0_0_25px_8px_rgba(var(--primary)/0.3)]">
                <Image
                  src="/herosection.png"
                  alt="Pixelated portrait of Shresht"
                  width={192} // Provide explicit width for layout
                  height={192} // Provide explicit height for layout
                  priority
                  className="object-contain w-full h-full rounded-full overflow-hidden" // Clip image content
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            ref={heroContentRef} // Use ref for potential future group animations
            className="text-center relative z-10" // Ensure text is above potential background elements
          >
            {/* Wrap title letters */}
            <h1
              ref={titleRef}
              className="text-5xl md:text-6xl font-bold mb-4 md:mb-6 leading-tight"
              aria-label="Shresht Bhowmick"
            >
              {'Shresht Bhowmick'.split('').map((char, index) => (
                <span key={index} className="inline-block opacity-0">
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </h1>
            <motion.p
              variants={item}
              initial="hidden"
              animate="show"
              transition={{ delay: 1.0 }} // Adjust delay based on new timings
              className="text-xl md:text-2xl mb-6 md:mb-8 text-muted-foreground"
            >
              I build robots, turing machines, ML models, fantasy worlds, and other cool stuff!
            </motion.p>
            <motion.div
              variants={item}
              initial="hidden"
              animate="show"
              transition={{ delay: 1.2 }} // Adjust delay
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link 
                href="/projects"
                className="w-full sm:w-auto inline-block px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary border-2 border-primary/30 transition-colors font-pixel text-center"
              >
                Explore My Work
              </Link>
              <Link 
                href="/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-block px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary border-2 border-primary/30 transition-colors font-pixel text-center"
              >
                Download Resume
              </Link>
              <Link 
                href="https://buymeacoffee.com/tetraslam"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-block px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary border-2 border-primary/30 transition-colors font-pixel text-center"
              >
                Buy Me a Coffee
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Highlights Grid */}
      <section className="py-16 px-8 bg-secondary/5">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          <h2 className="text-3xl font-bold mb-8 text-center">Featured Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProjects.map((project) => (
              <motion.div
                key={project?.id}
                whileHover={{ scale: 1.02 }}
                className="relative bg-card/30 backdrop-blur-sm border border-border rounded-sm p-6 overflow-hidden group"
              >
                <div className="relative w-full h-48 mb-4 bg-muted rounded-sm overflow-hidden">
                  {project?.image && (
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2">{project?.title}</h3>
                <p className="text-muted-foreground mb-4">{project?.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project?.techStack.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/projects?project=${project?.id}`}
                  className="inline-block text-sm text-primary hover:text-accent transition-colors"
                >
                  Learn more →
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </>
  );
}
