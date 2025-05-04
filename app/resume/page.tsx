import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resume – Shresht Bhowmick',
  description: "Interactive web version of Shresht's resume with downloadable PDF.",
};

export default function ResumePage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="text-center space-y-3">
          <h1 className="text-4xl font-bold">Resume</h1>
          <p className="text-muted-foreground">Interactive HTML résumé below – or grab the PDF if you prefer.</p>
          <Link
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary border-2 border-primary/30 transition-colors font-pixel"
          >
            Download PDF
          </Link>
        </header>

        {/* Responsive two-column layout */}
        <section className="bg-card/30 border border-border rounded-sm p-6 md:p-10 grid gap-10 md:grid-cols-3">
          {/* LEFT (Experiences & Projects) */}
          <div className="md:col-span-2 space-y-8">
            {/* Experience */}
            <div>
              <h2 className="text-xl font-bold mb-4 text-primary">Experience</h2>

              {/* MIT Media Lab */}
              <div className="mb-6">
                <h3 className="font-semibold leading-snug">MIT Media Lab – Fluid Interfaces Group <span className="text-muted-foreground font-normal">| Researcher</span></h3>
                <p className="text-xs text-muted-foreground mb-1">Jan 2025 – Present · Boston, MA</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Training embedding models to create digital twins.</li>
                  <li>Building personal AI stacks (data pipelines, on-device inference, hardware integration) to empower users with full control over their own models.</li>
                  <li>ML research on fine-tuning and post-training optimisation, focusing on replicating and adapting individual styles of thought and writing.</li>
                  <li>Investigating novel approaches in linguistics and information theory to refine embedding architectures.</li>
                </ul>
              </div>

              {/* Neuromechanics Lab */}
              <div className="mb-6">
                <h3 className="font-semibold leading-snug">Northeastern Neuromechanics Lab <span className="text-muted-foreground font-normal">| Researcher</span></h3>
                <p className="text-xs text-muted-foreground mb-1">Oct 2024 – Present · Boston, MA</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Built high-performance computing pipeline for &gt;200 GB dataset processing, 8× speed-up over previous flow.</li>
                  <li>Developing RL algorithms for complex exoskeleton & human movement control.</li>
                  <li>Participating in NeurIPS as organiser and researcher in the MyoChallenge.</li>
                </ul>
              </div>

              {/* Samantra Labs */}
              <div className="mb-6">
                <h3 className="font-semibold leading-snug">Samantar Labs <span className="text-muted-foreground font-normal">| Software Engineering Intern</span></h3>
                <p className="text-xs text-muted-foreground mb-1">Jun 2022 – Dec 2022 · Bangalore, India</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Reduced cloud infra expenses by $2.5 k / month through efficient SDK deployment and resource optimisation.</li>
                </ul>
              </div>

              {/* RoboCup */}
              <div className="mb-6">
                <h3 className="font-semibold leading-snug">RoboCup <span className="text-muted-foreground font-normal">| Team Captain</span></h3>
                <p className="text-xs text-muted-foreground mb-1">Dec 2022 – Jul 2023 · Paris, France</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Led team to 1<sup>st</sup> place finish at Nationals; represented India at the Bordeaux International Round.</li>
                  <li>Engineered & optimised four autonomous robots (Arduino + Raspberry Pi).</li>
                </ul>
              </div>
            </div>

            {/* Projects / Publications */}
            <div>
              <h2 className="text-xl font-bold mb-4 text-primary">Projects / Awards / Publications</h2>

              {/* Publication */}
              <div className="mb-6">
                <h3 className="font-semibold leading-snug">Publication @ Neuronomonster 2025 <span className="text-muted-foreground font-normal">| Neuronal Computing</span></h3>
                <p className="text-xs text-muted-foreground mb-1">Jan 2025 – Jun 2025</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Led research & development of a novel code-free framework for neural automata on a canvas; customise learning parameters & benchmark.</li>
                  <li>Spotlight presentation @ 6<sup>th</sup> International Conference for the Mathematics of Neuroscience & AI.</li>
                </ul>
              </div>

              {/* FiberFinder */}
              <div className="mb-6">
                <h3 className="font-semibold leading-snug">FiberFinder <span className="text-muted-foreground font-normal">| Computer Vision for Recycling</span></h3>
                <p className="text-xs text-muted-foreground mb-1">Dec 2022 – Present</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>ML model detecting non-textile parts on clothes for automated recycling. Bangalore pilot + Blue Ocean Entrepreneurship finalist.</li>
                </ul>
              </div>

              {/* TF-IDF */}
              <div className="mb-6">
                <h3 className="font-semibold leading-snug">TF-IDF Sentiment Analysis <span className="text-muted-foreground font-normal">| Urdu Language</span></h3>
                <p className="text-xs text-muted-foreground mb-1">Jul 2022 – Jan 2023</p>
                <p className="text-sm">Sentiment analysis paper – Forum for Information Retrieval Evaluation, Best Paper award. <Link href="https://ceur-ws.org" className="text-primary underline" target="_blank">Read paper</Link>.</p>
              </div>

              {/* SHFLA */}
              <div className="mb-6">
                <h3 className="font-semibold leading-snug">SHFLA <span className="text-muted-foreground font-normal">| Turing-Complete Music-to-Fractal Language</span></h3>
                <p className="text-xs text-muted-foreground mb-1">Oct 2024</p>
                <p className="text-sm">Created SHFLA, a Turing-complete system mapping musical input to real-time fractal visuals. <Link href="https://github.com/tetraslam/SHFLA" className="text-primary underline" target="_blank">GitHub repo</Link>.</p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-8">
            {/* Education */}
            <div>
              <h2 className="text-lg font-bold mb-2 text-primary">Education</h2>
              <p className="font-semibold">Northeastern University</p>
              <p className="text-sm">B.S. Computer Science & Linguistics<br/>Minor in Math</p>
              <p className="text-sm text-muted-foreground">Expected Apr 2027 · Boston, MA<br/>GPA: 4.0 / 4.0</p>
            </div>

            {/* Skills */}
            <div>
              <h2 className="text-lg font-bold mb-2 text-primary">Skills</h2>
              <p className="font-semibold text-sm mb-1">Programming</p>
              <p className="text-sm">Python • C • Nim • Go • TypeScript • Rust • Fortran • Zig</p>
              <p className="font-semibold text-sm mt-3 mb-1">Technology</p>
              <p className="text-sm">Git • Supabase • Linux • PostgreSQL • Next.js • Redis • Bash • PyTorch • HPC • DSA • Network protocols • Concurrency • Posthog • FastAPI • Node.js • NumPy • CUDA • Triton • Tinygrad</p>
            </div>

            {/* Coursework */}
            <div>
              <h2 className="text-lg font-bold mb-2 text-primary">Coursework</h2>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Data Structures & Algorithms</li>
                <li>Accelerated Discrete Math</li>
                <li>Calculus III / Linear Algebra</li>
                <li>Graduate-level Algorithms</li>
                <li>Matrix Methods & ML</li>
                <li>Compilers</li>
                <li>Real Analysis</li>
                <li>AI Fundamentals</li>
                <li>Networks & Distributed Systems</li>
              </ul>
            </div>

            {/* Societies */}
            <div>
              <h2 className="text-lg font-bold mb-2 text-primary">Societies</h2>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>AeroN Satellite Avionics</li>
                <li>Rev Startup School Cohort 2</li>
                <li>MIT Augmentation Lab</li>
                <li>Northeastern Quantum Photonics Lab</li>
              </ul>
            </div>

            {/* Links */}
            <div>
              <h2 className="text-lg font-bold mb-2 text-primary">Links</h2>
              <ul className="text-sm space-y-1">
                <li><Link href="https://github.com/tetraslam" className="underline text-primary" target="_blank">GitHub // Tetraslam</Link></li>
                <li><Link href="https://linkedin.com/in/shreshtbhowmick" className="underline text-primary" target="_blank">LinkedIn // shreshtbhowmick</Link></li>
                <li><Link href="https://blog.tetraslam.world" className="underline text-primary" target="_blank">About Me (fun!) // blog.tetraslam.world</Link></li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
} 