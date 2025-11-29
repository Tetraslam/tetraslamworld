import { ConwayBackground } from "@/components/conway-background";

export default function Home() {
  return (
    <>
      <ConwayBackground />
    <div className="min-h-[calc(100vh-3rem)] flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight">tetraslam's world</h1>
          <p className="text-lg text-muted-foreground">
            shresht bhowmick / builder, tinkerer, contrarian
          </p>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>currently: founding engineer @ stealth</p>
          <p>previously: princeton, openai, etc</p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center text-sm">
          <a
            href="https://twitter.com/tetraslam"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 border border-border rounded hover:border-rose/50 hover:bg-rose/5 transition-all"
          >
            twitter
          </a>
          <a
            href="https://github.com/tetraslam"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 border border-border rounded hover:border-rose/50 hover:bg-rose/5 transition-all"
          >
            github
          </a>
          <a
            href="https://blog.tetraslam.world"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 border border-border rounded hover:border-rose/50 hover:bg-rose/5 transition-all"
          >
            blog
          </a>
          <a
            href="mailto:shresht@tetraslam.world"
            className="px-3 py-1.5 border border-border rounded hover:border-rose/50 hover:bg-rose/5 transition-all"
          >
            email
          </a>
        </div>

        <p className="text-xs text-muted-foreground/60">
          press <kbd className="px-1 py-0.5 bg-surface rounded border border-border text-rose">ctrl+k</kbd> to navigate
        </p>
      </div>
    </div>
    </>
  );
}
