'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { type Project, starProject, getProjectStars } from '@/lib/project-data';
import Image from 'next/image';

interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
}

export function ProjectCard({ project, onSelect }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [hasStarred, setHasStarred] = useState(false);
  const [starCount, setStarCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchStars = async () => {
      const stars = await getProjectStars(project.id);
      setStarCount(stars);
    };
    fetchStars();
  }, [project.id]);

  const handleStar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasStarred) {
      try {
        await starProject(project.id);
        setStarCount(prev => prev + 1);
        setHasStarred(true);
      } catch (error) {
        console.error('Error starring project:', error);
      }
    }
  };

  const handleInteraction = () => {
    if (isMobile) {
      setIsHovered(!isHovered);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -5 }}
      onHoverStart={() => !isMobile && setIsHovered(true)}
      onHoverEnd={() => !isMobile && setIsHovered(false)}
      onClick={handleInteraction}
      id={`project-${project.id}`}
      className="group relative bg-card/30 backdrop-blur-md border-2 border-primary/20 rounded-none overflow-hidden before:absolute before:inset-0 before:border-2 before:border-primary/10 before:m-1 after:absolute after:inset-0 after:border-2 after:border-primary/5 after:m-2"
    >
      {/* Project Image */}
      <div className="relative aspect-video bg-background/40 overflow-hidden">
        {project.image && (
          <Image
            src={project.image}
            alt={project.title}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <h3 className="text-xl font-pixel text-primary mb-2 group-hover:text-accent transition-colors duration-300">{project.title}</h3>
          <p className="text-sm text-foreground/80">{project.description}</p>
        </div>
      </div>

      {/* Project Details */}
      <div className="p-6 space-y-6">
        {/* Tech Stack */}
        <div className="flex flex-wrap gap-2">
          {project.techStack.map((tech) => (
            <span
              key={tech}
              className="px-3 py-1.5 text-xs font-pixel bg-primary/10 border border-primary/20 text-primary/90"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Achievements */}
        <ul className="text-sm text-foreground/80 space-y-2">
          {project.achievements.slice(0, 2).map((achievement, i) => (
            <li key={i} className="flex items-center">
              <span className="inline-block w-2 h-2 bg-primary/50 mr-2" />
              {achievement}
            </li>
          ))}
        </ul>

        {/* Star Count */}
        <div className="flex items-center justify-between">
          <div 
            className={`flex items-center space-x-2 ${!isMobile && !hasStarred ? 'cursor-pointer hover:opacity-80' : ''}`}
            onClick={(e) => {
              if (!isMobile && !hasStarred) {
                handleStar(e);
              }
            }}
          >
            <span className="text-lg font-pixel text-primary">⭐</span>
            <span className="text-sm font-pixel text-foreground/60">
              {starCount}
            </span>
          </div>
        </div>
      </div>

      {/* Links Overlay */}
      <motion.div
        initial={false}
        animate={{ opacity: isHovered ? 1 : 0 }}
        className={`absolute inset-0 z-20 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center gap-4 ${
          isHovered ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-6">
          {project.links.github && (
            <a
              href={project.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 font-pixel bg-primary/10 border-2 border-primary/30 text-primary hover:bg-primary/20 hover:text-accent transition-all duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              GitHub
            </a>
          )}
          {project.links.demo && (
            <a
              href={project.links.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 font-pixel bg-primary/20 border-2 border-primary/30 text-primary hover:bg-primary/30 hover:text-accent transition-all duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              Demo
            </a>
          )}
          {project.links.website && (
            <a
              href={project.links.website}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 font-pixel bg-primary/20 border-2 border-primary/30 text-primary hover:bg-primary/30 hover:text-accent transition-all duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              Website
            </a>
          )}
          {project.links.blog && (
            <a
              href={project.links.blog}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 font-pixel bg-primary/20 border-2 border-primary/30 text-primary hover:bg-primary/30 hover:text-accent transition-all duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              Blog
            </a>
          )}
          {project.links.comingsoon && (
            <a
              href={project.links.comingsoon}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 font-pixel bg-primary/20 border-2 border-primary/30 text-primary hover:bg-primary/30 hover:text-accent transition-all duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              Coming Soon
            </a>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(project);
            }}
            className="px-6 py-3 font-pixel bg-secondary/20 border-2 border-secondary/30 text-secondary hover:bg-secondary/30 hover:text-accent transition-all duration-300"
          >
            Details
          </button>
          <button
            onClick={handleStar}
            disabled={hasStarred}
            className={`px-6 py-3 font-pixel border-2 ${
              hasStarred 
                ? 'bg-primary/5 border-primary/10 text-primary/50 cursor-not-allowed'
                : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 hover:text-accent transition-all duration-300'
            }`}
          >
            {hasStarred ? 'Starred ⭐' : 'Star ⭐'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
} 