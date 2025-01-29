'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

interface Node {
  id: string;
  group: number;
  label: string;
  details: string;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

interface SimulationNode extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  label: string;
  details: string;
  x?: number;
  y?: number;
}

type D3Selection = d3.Selection<SVGGElement, SimulationNode, null, undefined>;
type D3Simulation = d3.Simulation<SimulationNode, undefined>;
type D3DragBehavior = d3.DragBehavior<Element, SimulationNode, SimulationNode>;
type D3ZoomBehavior = d3.ZoomBehavior<Element, unknown>;

const nodes: Node[] = [
  { id: "core", group: 1, label: "Core", details: "CS + Linguistics @ Northeastern" },
  { id: "tech", group: 2, label: "Tech", details: "Python, Nim, C++, TypeScript, ML/AI" },
  { id: "projects", group: 2, label: "Projects", details: "SHFLA, Sapientia, Oomfboard" },
  { id: "languages", group: 3, label: "Languages", details: "English, French, Japanese, Korean" },
  { id: "interests", group: 3, label: "Interests", details: "Bonsai, Scuba, Worldbuilding" },
  { id: "values", group: 4, label: "Values", details: "Open Source, Innovation, Education" },

  // Deeper Tech & Research
  { id: "ml", group: 2, label: "Machine Learning", details: "LLMs, Reinforcement Learning, Vector DBs" },
  { id: "biocomputing", group: 2, label: "Biocomputing", details: "Neuron-based computers, MEAs, Homomorphic Encryption" },
  { id: "cybersec", group: 2, label: "Cybersecurity", details: "Red Teaming, Reinforcement Learning in Security" },
  { id: "game-dev", group: 2, label: "Game Development", details: "Godot, Roguelikes, Procedural Generation" },

  // Specific Projects
  { id: "shfla", group: 2, label: "SHFLA", details: "Turing-complete fractal language for music" },
  { id: "sapientia", group: 2, label: "Sapientia Research", details: "Emergent Tech, Applied Math, Patents" },
  { id: "oomfboard", group: 2, label: "Oomfboard", details: "High-signal, invite-only social board" },
  { id: "fiberfinder", group: 2, label: "Photonics", details: "Topological frequency comb research" },

  // Linguistics
  { id: "morpho", group: 3, label: "Morphology", details: "Algorithmic analysis, language construction" },
  { id: "phonology", group: 3, label: "Phonology", details: "Corpus analysis, Kansai dialect research" },
  { id: "pragmatics", group: 3, label: "Pragmatics", details: "Conversational AI, sociolinguistics" },

  // Personal Interests
  { id: "anime", group: 3, label: "Anime", details: "Kill la Kill, Mushoku Tensei, Frieren" },
  { id: "travel", group: 3, label: "Travel", details: "30+ countries, deep culture immersion" },
  { id: "fashion", group: 3, label: "Fashion", details: "Superdry, functional + aesthetic design" },
  { id: "core", group: 1, label: "Core", details: "CS + Linguistics @ Northeastern" },
  { id: "tech", group: 2, label: "Tech", details: "Python, Nim, C++, TypeScript, ML/AI" },
  { id: "projects", group: 2, label: "Projects", details: "SHFLA, Sapientia, Oomfboard" },
  { id: "languages", group: 3, label: "Languages", details: "English, French, Japanese, Korean" },
  { id: "interests", group: 3, label: "Interests", details: "Bonsai, Scuba, Worldbuilding" },
  { id: "values", group: 4, label: "Values", details: "Open Source, Innovation, Education" },

  // Deeper Tech & Research
  { id: "ml", group: 2, label: "Machine Learning", details: "LLMs, Reinforcement Learning, Vector DBs" },
  { id: "biocomputing", group: 2, label: "Biocomputing", details: "Neuron-based computers, MEAs, Homomorphic Encryption" },
  { id: "cybersec", group: 2, label: "Cybersecurity", details: "Red Teaming, Reinforcement Learning in Security" },
  { id: "game-dev", group: 2, label: "Game Development", details: "Godot, Roguelikes, Procedural Generation" },

  // Specific Projects
  { id: "shfla", group: 2, label: "SHFLA", details: "Turing-complete fractal language for music" },
  { id: "sapientia", group: 2, label: "Sapientia Research", details: "Emergent Tech, Applied Math, Patents" },
  { id: "oomfboard", group: 2, label: "Oomfboard", details: "High-signal, invite-only social board" },
  { id: "fiberfinder", group: 2, label: "FiberFinder", details: "Topological frequency comb research" },

  // Linguistics
  { id: "morpho", group: 3, label: "Morphology", details: "Algorithmic analysis, language construction" },
  { id: "phonology", group: 3, label: "Phonology", details: "Corpus analysis, Kansai dialect research" },
  { id: "pragmatics", group: 3, label: "Pragmatics", details: "Conversational AI, sociolinguistics" },

  // Personal Interests
  { id: "anime", group: 3, label: "Anime", details: "Kill la Kill, Mushoku Tensei, Frieren" },
  { id: "travel", group: 3, label: "Travel", details: "30+ countries, deep culture immersion" },
  { id: "fashion", group: 3, label: "Fashion", details: "Superdry, functional + aesthetic design" },

  // Future Goals
  { id: "neuro-labs", group: 4, label: "Neuro Labs", details: "Building secure neuro research infrastructure" },
  { id: "fintech", group: 4, label: "Fintech", details: "Destroying Visa, rethinking credit systems" },
  { id: "education", group: 4, label: "Education", details: "Redefining university models" },
  { id: "ai-governance", group: 4, label: "AI Governance", details: "Aligning AI incentives at scale" },
  { id: "digital-twins", group: 4, label: "Digital Twins", details: "Simulating real-world economies & people" },

  // Economic & Philosophical Views
  { id: "accelerationism", group: 4, label: "Accelerationism", details: "Technology must move faster, not slower" },
  { id: "privacy", group: 4, label: "Privacy", details: "Decentralized identity, post-surveillance world" },
  { id: "ai-labor", group: 4, label: "AI & Labor", details: "Optimizing humans out of repetitive tasks" },
  { id: "cryptoeconomics", group: 4, label: "Crypto Economics", details: "Rethinking financial sovereignty" },

  // Niche Interests & Fun
  { id: "culinary", group: 3, label: "Culinary", details: "Baking + cooking thanks to a Cordon Bleu mom" },
  { id: "karaoke", group: 3, label: "Karaoke", details: "J-rock & K-pop, high-energy or sentimental" },
  { id: "esports", group: 3, label: "Esports", details: "Dream of running an org, deep game theory" },
  { id: "scuba-tech", group: 3, label: "Scuba Tech", details: "Shipwreck diving + autonomous underwater drones" }
];


const links: Link[] = [
  // Core connections
  { source: "core", target: "tech", value: 3 },
  { source: "core", target: "languages", value: 2 },
  { source: "core", target: "interests", value: 2 },
  { source: "core", target: "values", value: 3 },

  // Tech connections
  { source: "tech", target: "projects", value: 3 },
  { source: "tech", target: "ml", value: 3 },
  { source: "tech", target: "biocomputing", value: 3 },
  { source: "tech", target: "cybersec", value: 3 },
  { source: "tech", target: "game-dev", value: 2 },

  // Project interconnections
  { source: "projects", target: "shfla", value: 3 },
  { source: "projects", target: "sapientia", value: 3 },
  { source: "projects", target: "oomfboard", value: 2 },
  { source: "projects", target: "fiberfinder", value: 2 },

  // ML and Biocomputing branches
  { source: "ml", target: "digital-twins", value: 2 },
  { source: "biocomputing", target: "neuro-labs", value: 3 },

  // Cybersecurity & AI Governance
  { source: "cybersec", target: "ai-governance", value: 3 },
  { source: "cybersec", target: "privacy", value: 2 },

  // Linguistics branches
  { source: "languages", target: "morpho", value: 2 },
  { source: "languages", target: "phonology", value: 2 },
  { source: "languages", target: "pragmatics", value: 2 },

  // Interests
  { source: "interests", target: "anime", value: 2 },
  { source: "interests", target: "travel", value: 2 },
  { source: "interests", target: "fashion", value: 1 },
  { source: "interests", target: "culinary", value: 2 },
  { source: "interests", target: "karaoke", value: 2 },
  { source: "interests", target: "esports", value: 2 },
  { source: "interests", target: "scuba-tech", value: 2 },

  // Values connections
  { source: "values", target: "education", value: 3 },
  { source: "values", target: "fintech", value: 2 },
  { source: "values", target: "ai-governance", value: 3 },
  { source: "values", target: "cryptoeconomics", value: 3 },
  { source: "values", target: "accelerationism", value: 2 },

  // Cross-connections for stronger network flow
  { source: "digital-twins", target: "fintech", value: 2 },
  { source: "fintech", target: "cryptoeconomics", value: 2 },
  { source: "privacy", target: "cryptoeconomics", value: 2 },
  { source: "neuro-labs", target: "privacy", value: 2 },
  { source: "anime", target: "game-dev", value: 1 },
  { source: "travel", target: "fashion", value: 1 }
];


const NODE_RADIUS = 20;
const LINK_DISTANCE = 200;
const CHARGE_STRENGTH = -100;

export function NeuralNetwork() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const container = svgRef.current.parentElement;
        if (container) {
          setDimensions({
            width: container.clientWidth,
            height: Math.min(container.clientWidth * 0.75, window.innerHeight * 0.7),
          });
        }
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current);
    
    // Create the simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(LINK_DISTANCE))
      .force("charge", d3.forceManyBody().strength(CHARGE_STRENGTH))
      .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force("collision", d3.forceCollide().radius(NODE_RADIUS * 1.5));

    // Add links
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "var(--primary)")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", (d) => Math.sqrt(d.value) * 3);

    // Add nodes
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (event, d) => setSelectedNode(d))
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    // Add node circles
    node.append("circle")
      .attr("r", NODE_RADIUS)
      .attr("fill", "var(--secondary)")
      .attr("fill-opacity", 0.3)
      .attr("stroke", "var(--primary)")
      .attr("stroke-opacity", 0.8)
      .attr("stroke-width", 2);

    // Add node labels
    node.append("text")
      .text((d) => d.label)
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("fill", "hsl(var(--primary))")
      .attr("font-size", "16px")
      .attr("font-weight", "600")
      .attr("class", "font-pixel text-primary")
      .style("fill", "hsl(var(--primary))");

    // Update positions on each tick
    simulation.on("tick", () => {
      nodes.forEach((d: any) => {
        d.x = Math.max(NODE_RADIUS, Math.min(dimensions.width - NODE_RADIUS, d.x));
        d.y = Math.max(NODE_RADIUS, Math.min(dimensions.height - NODE_RADIUS, d.y));
      });

      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [dimensions]);

  return (
    <div className="w-full">
      <div className="relative bg-card/30 backdrop-blur-md border-2 border-primary/20 rounded-none overflow-hidden">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full"
        />
      </div>
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-6 relative bg-card/30 backdrop-blur-md border-2 border-primary/20 rounded-none"
        >
          <h3 className="text-xl font-pixel text-primary mb-3">{selectedNode.label}</h3>
          <p className="text-sm text-foreground/80 leading-relaxed">{selectedNode.details}</p>
        </motion.div>
      )}
    </div>
  );
} 