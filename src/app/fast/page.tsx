import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "fast",
  description:
    "examples of people, and lately models, quickly accomplishing ambitious things in ai.",
  alternates: { canonical: "/fast" },
};

// The whole page is fast.md, next to this file. Edit that. It is read on
// each render so edits show up in dev without restarting the server.
export default function FastPage() {
  const content = readFileSync(
    join(process.cwd(), "src/app/fast/fast.md"),
    "utf8",
  );
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <PageHeader path="/fast" title="fast" subtitle="ai feats, quickly" />
      <div className="writing-prose fast-page">
        <ReactMarkdown
          components={{
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
