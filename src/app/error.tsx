"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center px-4 text-center">
      <pre
        aria-hidden="true"
        className="text-rose/50 text-xs leading-tight mb-6 select-none"
      >{`   /\\
  /  \\
 / ×× \\
/______\\`}</pre>
      <h1 className="text-3xl font-bold mb-3">something broke</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        the tetrahedron is embarrassed. try again?
      </p>
      <div className="flex gap-3 text-sm">
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 border border-rose/50 bg-rose/10 rounded-lg hover:border-rose hover:bg-rose/20 transition-all text-rose"
        >
          retry
        </button>
        <Link
          href="/"
          className="px-4 py-2 border border-border rounded-lg hover:border-rose/50 hover:bg-rose/5 transition-all text-muted-foreground hover:text-foreground"
        >
          ~ home
        </Link>
      </div>
    </div>
  );
}
