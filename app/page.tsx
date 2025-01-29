'use client';

import { motion } from "framer-motion";
import { projects } from "@/lib/project-data";

import Link from "next/link";
import Image from "next/image";

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
  return (
    <>
      {/* Hero Section */}
      <section className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="text-center max-w-3xl mx-auto"
        >
          <motion.h1 
            variants={item}
            className="text-6xl font-bold mb-6 leading-tight"
          >
            Shresht Bhowmick
          </motion.h1>
          <motion.p 
            variants={item}
            className="text-2xl mb-8 text-muted-foreground"
          >
            I build robots, turing machines, ML models, fantasy worlds, and other cool stuff!
          </motion.p>
          <motion.div variants={item}>
            <Link 
              href="/projects"
              className="inline-block px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary border-2 border-primary/30 transition-colors font-pixel"
            >
              Explore My Work
            </Link>
            <Link 
  href="/resume.pdf"
  target="_blank"
  rel="noopener noreferrer"
  className="inline-block px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary border-2 border-primary/30 transition-colors font-pixel"
>
  Download Resume
</Link>
<Link 
  href="https://buymeacoffee.com/tetraslam"
  target="_blank"
  rel="noopener noreferrer"
  className="inline-block px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary border-2 border-primary/30 transition-colors font-pixel"

    >
  Buy Me a Coffee
</Link>
          </motion.div>
          <br></br>
          <motion.div variants={item}>
          

          </motion.div>
        </motion.div>
        
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
                  href={`/projects?id=${project?.id}`}
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
