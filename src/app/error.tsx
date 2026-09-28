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
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl mb-6">couldn’t load this page</h1>
      <div className="flex gap-6">
        <button type="button" onClick={reset}>
          try again
        </button>
        <Link href="/">back home</Link>
      </div>
    </div>
  );
}
