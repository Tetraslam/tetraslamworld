'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { type Project } from '@/lib/project-data';
import Image from 'next/image';

interface ProjectDetailsProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectDetails({ project, onClose }: ProjectDetailsProps) {
  if (!project) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-card border border-border rounded-sm p-6 overflow-y-auto max-h-[90vh]"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            ×
          </button>

          {/* Project header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">{project.title}</h2>
            <p className="text-muted-foreground">{project.description}</p>
          </div>

          {/* Project image */}
          <div className="relative aspect-video bg-muted rounded-sm mb-6 overflow-hidden">
            {project.image && (
              <Image
                src={project.image}
                alt={project.title}
                fill
                className="object-cover"
              />
            )}
          </div>

          {/* Project details */}
          <div className="space-y-6">
            {/* Long description */}
            <div>
              <h3 className="text-lg font-semibold mb-2">About</h3>
              <p className="text-muted-foreground">{project.longDescription}</p>
            </div>

            {/* Tech stack */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-1 text-sm bg-secondary text-secondary-foreground rounded-sm"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Key Achievements</h3>
              <ul className="space-y-2">
                {project.achievements.map((achievement, i) => (
                  <li key={i} className="text-muted-foreground">
                    • {achievement}
                  </li>
                ))}
              </ul>
            </div>

            {/* Links */}
            <div className="flex gap-4 pt-4">
              {project.links.github && (
                <a
                  href={project.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-card border border-border rounded-sm hover:bg-card/80 transition-colors"
                >
                  View on GitHub
                </a>
              )}
              {project.links.demo && (
                <a
                  href={project.links.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors"
                >
                  Live Demo
                </a>
              )}
              {project.links.blog && (
                <a
                  href={project.links.blog}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-card border border-border rounded-sm hover:bg-card/80 transition-colors"
                >
                  Read Blog Post
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 