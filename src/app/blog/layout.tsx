import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "writing",
  description: "thoughts, notes, and ramblings from shresht.",
  alternates: {
    canonical: "/blog",
    types: { "text/markdown": "/blog.md" },
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
