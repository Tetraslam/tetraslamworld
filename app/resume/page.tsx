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

              {/* MOSAIC AI */}
              <div className="mb-6">
                <h3 className="font-semibold leading-snug">MOSAIC AI (YC W25) <span className="text-muted-foreground font-normal">| ML Engineering Intern</span></h3>
                <p className="text-xs text-muted-foreground mb-1">May 2025 – August 2025 · San Francisco, CA</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Designed, made full architecture decisions for, and built public-facing API for triggering video editing agents programmatically.</li>
                  <li>Built music tile with tone-matching for each video with rhythm sync.</li>
                  <li>Scaled platform to &gt;3000 paying subscribers by managing the twitter account and building an automatic video pipeline for constant growth marketing.</li>
                </ul>
              </div>

              {/* MIT Media Lab */}
              <div className="mb-6">
                <h3 className="font-semibold leading-snug">MIT Media Lab Fluid Interfaces Group <span className="text-muted-foreground font-normal">| Researcher</span></h3>
                <p className="text-xs text-muted-foreground mb-1">January 2025 – Present · Boston, MA</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Training embedding models to create digital twins.</li>
                  <li>Building personal AI stacks (data pipelines, on-device inference, hardware integration) to empower users with full control over their own models.</li>
                  <li>ML research on fine-tuning and post-training optimization, with a focus on replicating and adapting individual styles of thought and writing.</li>
                  <li>Investigating novel approaches in linguistics and information theory to refine embedding architectures.</li>
                </ul>
              </div>

              {/* Neuromechanics Lab */}
              <div className="mb-6">
                <h3 className="font-semibold leading-snug">Northeastern Neuromechanics Lab <span className="text-muted-foreground font-normal">| Researcher</span></h3>
                <p className="text-xs text-muted-foreground mb-1">October 2024 – May 2025 · Boston, MA</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Built high-performance computing pipeline for &gt;200GB dataset processing, 80× ed the speed of the previous pipeline.</li>
                  <li>Developed reinforcement learning (RL) algorithms for controlling complex exoskeleton and human movement.</li>
                  <li>Participated in NeurIPS as an organizer and researcher in the MyoChallenge.</li>
                </ul>
              </div>

              {/* RoboCup */}
              <div className="mb-6">
                <h3 className="font-semibold leading-snug">RoboCup <span className="text-muted-foreground font-normal">| Team Captain</span></h3>
                <p className="text-xs text-muted-foreground mb-1">Dec 2022 – July 2023 · Paris, France</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Led team to 1st place finish at Nationals; represented India at the Bordeaux International Round.</li>
                  <li>Engineered, programmed, and optimized four autonomous robots using Arduino and Raspberry Pi.</li>
                </ul>
              </div>
            </div>

            {/* Projects / Publications */}
            <div>
              <h2 className="text-xl font-bold mb-4 text-primary">Projects/Awards/Publications</h2>

              {/* Publication */}
              <div className="mb-6">
                <h3 className="font-semibold leading-snug">Publication @ NeuroMonster 2025 <span className="text-muted-foreground font-normal">| Neuronal Computing</span></h3>
                <p className="text-xs text-muted-foreground mb-1">January 2025 – June 2025</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Led research and development of a novel code framework and tool which enables scientists to paint neural cellular automata on a canvas, customize learning parameters and other constraints, and run benchmarking tasks.</li>
                  <li>Spotlight presentation @ the 6th International Conference for the Mathematics of Neuroscience and AI.</li>
                </ul>
              </div>

              {/* FiberFinder */}
              <div className="mb-6">
                <h3 className="font-semibold leading-snug">FiberFinder <span className="text-muted-foreground font-normal">| Computer Vision for Recycling</span></h3>
                <p className="text-xs text-muted-foreground mb-1">December 2022 – Present</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>ML model which detects non-textile parts on clothes for automated recycling. Used in Bangalore's recycling program + finalist at the Blue Ocean Entrepreneurship Competition.</li>
                </ul>
              </div>

              {/* TF-IDF */}
              <div className="mb-6">
                <h3 className="font-semibold leading-snug">TF-IDF Sentiment Analysis <span className="text-muted-foreground font-normal">| Urdu Language</span></h3>
                <p className="text-xs text-muted-foreground mb-1">July 2022 – Jan 2023</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Sentiment analysis paper which won the Forum for Information Retrieval Evaluation's Best Paper award. <Link href="https://ceur-ws.org" className="text-primary underline" target="_blank">https://ceur-ws.org</Link></li>
                </ul>
              </div>

              {/* SHFLA */}
              <div className="mb-6">
                <h3 className="font-semibold leading-snug">SHFLA <span className="text-muted-foreground font-normal">| Turing-Complete Music-To-Fractal Language</span></h3>
                <p className="text-xs text-muted-foreground mb-1">October 2024</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Created SHFLA, a Turing-complete system mapping musical input to real-time fractal visuals, winning the MIT Media Lab hackathon. <Link href="https://github.com/Tetraslam/SHFLA" className="text-primary underline" target="_blank">https://github.com/Tetraslam/SHFLA</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-8">
            {/* Education */}
            <div>
              <h2 className="text-lg font-bold mb-2 text-primary">Education</h2>
              <p className="font-semibold">Northeastern University</p>
              <p className="text-sm">Bachelor of Science in Computer Science and Linguistics with a Minor in Math</p>
              <p className="text-sm text-muted-foreground">Expected April 2027 · Boston, MA<br/>Cum. GPA: 4.0 / 4.0</p>
            </div>

            {/* Skills */}
            <div>
              <h2 className="text-lg font-bold mb-2 text-primary">Skills</h2>
              <p className="font-semibold text-sm mb-1">Programming</p>
              <p className="text-sm mb-2">
                <span className="text-muted-foreground">5+ years:</span><br/>
                Python • C • Nim
              </p>
              <p className="text-sm mb-2">
                <span className="text-muted-foreground">3+ years:</span><br/>
                Go • TypeScript
              </p>
              <p className="text-sm mb-3">
                <span className="text-muted-foreground">1+ years:</span><br/>
                Rust • Fortran • Zig
              </p>
              
              <p className="font-semibold text-sm mb-1">Technology</p>
              <p className="text-sm">Git • Supabase • Linux • PostgreSQL • NextJS • Redis • Bash • PyTorch • HPC • DSA • Network protocols • Concurrency • Shadcn • Posthog • TypeScript • FastAPI • NodeJS • NumPy • CUDA • Triton • Tinygrad</p>
            </div>

            {/* Coursework */}
            <div>
              <h2 className="text-lg font-bold mb-2 text-primary">Coursework</h2>
              <p className="font-semibold text-sm mb-1">Undergraduate</p>
              <ul className="list-disc list-inside text-sm space-y-1 mb-3">
                <li>Data Structures and Algorithms</li>
                <li>Accelerated Discrete Math</li>
                <li>Object-Oriented Design</li>
                <li>Calculus III</li>
                <li>Advanced Linear Algebra</li>
                <li>Graduate-Level Algorithms</li>
                <li>Matrix Methods and Machine Learning</li>
                <li>Compilers</li>
                <li>Real Analysis</li>
                <li>Fundamentals of Artificial Intelligence</li>
                <li>Networks and Distributed Systems</li>
              </ul>
            </div>

            {/* Societies */}
            <div>
              <h2 className="text-lg font-bold mb-2 text-primary">Societies</h2>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>AeroNU Satellite Avionics</li>
                <li>Rev Startup School Cohort 2</li>
                <li>MIT Augmentation Lab</li>
                <li>Northeastern Quantum Photonics Lab</li>
              </ul>
            </div>

            {/* Links */}
            <div>
              <h2 className="text-lg font-bold mb-2 text-primary">Links</h2>
              <ul className="text-sm space-y-1">
                <li><Link href="https://github.com/tetraslam" className="underline text-primary" target="_blank">Github:// Tetraslam</Link></li>
                <li><Link href="https://linkedin.com/in/shreshtbhowmick" className="underline text-primary" target="_blank">LinkedIn:// shreshtbhowmick</Link></li>
                <li><Link href="https://blog.tetraslam.world" className="underline text-primary" target="_blank">About Me (fun):// blog.tetraslam.world</Link></li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
} 