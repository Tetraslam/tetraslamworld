import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl mb-6">page not found</h1>
      <Link href="/">back home</Link>
    </div>
  );
}
