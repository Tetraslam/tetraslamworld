import Link from "next/link";
import { Glider } from "@/components/glider";

export default function NotFound() {
	return (
		<div className="min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center px-4 text-center">
			<Glider className="text-rose/50 text-sm mb-6 h-[5.25rem]" />
      <h1 className="text-5xl font-bold mb-3">404</h1>
      <p className="text-muted-foreground mb-1">
        this page has drifted off the grid.
      </p>
      <p className="text-xs text-muted-foreground/60 mb-8">
        (the glider above is looking for it)
      </p>
      <div className="flex gap-3 text-sm">
        <Link
          href="/"
          className="px-4 py-2 border border-rose/50 bg-rose/10 rounded-lg hover:border-rose hover:bg-rose/20 transition-all text-rose"
        >
          ~ home
        </Link>
        <Link
          href="/blog"
          className="px-4 py-2 border border-border rounded-lg hover:border-rose/50 hover:bg-rose/5 transition-all text-muted-foreground hover:text-foreground"
        >
          read the blog
        </Link>
      </div>
    </div>
  );
}
