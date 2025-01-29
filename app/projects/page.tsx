'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { projects, sortProjects, filterProjects, type Project } from '@/lib/project-data';
import { ProjectCard } from '@/components/ui/project-card';
import { ProjectDetails } from '@/components/ui/project-details';

type SortOption = 'date' | 'stars' | 'title';
type FilterOption = 'all' | 'software' | 'hardware' | 'research' | 'creative';

export default function ProjectsPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  const filteredProjects = filterProjects(
    projects,
    filterBy === 'all' ? undefined : filterBy
  );
  const sortedProjects = sortProjects(filteredProjects, sortBy);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl font-bold mb-4">Projects</h1>
          <p className="text-xl text-muted-foreground">
            A collection of my work in software, research, and creative endeavors
          </p>
        </motion.div>

        {/* Filters and Sort */}
        <div className="mb-8 flex flex-wrap gap-4 justify-between">
          <div className="flex gap-4">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="px-3 py-2 bg-card border border-border rounded-sm hover:bg-card/80 transition-colors"
            >
              <option value="all">All Categories</option>
              <option value="software">Software</option>
              <option value="hardware">Hardware</option>
              <option value="research">Research</option>
              <option value="creative">Creative</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 bg-card border border-border rounded-sm hover:bg-card/80 transition-colors"
            >
              <option value="date">Latest First</option>
              <option value="stars">Most Starred</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>

          <p className="text-sm text-muted-foreground">
            Showing {sortedProjects.length} projects
          </p>
        </div>

        {/* Project Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {sortedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onSelect={setSelectedProject}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Project Details Modal */}
        <ProjectDetails
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      </div>
    </main>
  );
} 