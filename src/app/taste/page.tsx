import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Markdown } from "@/components/taste/book/markdown";
import { Provenance } from "@/components/taste/book/provenance";
import {
  AlsoCollected,
  Constants,
  Directions,
  References,
  Rejected,
  Stack,
  TheBar,
} from "@/components/taste/book/sections";
import { getTasteBook } from "@/lib/tetrastack/book";
import { unreferenced } from "../../../shared/taste-book";
import { TETRASTACK_URL } from "../../../shared/tetrastack";

export const metadata: Metadata = {
  title: "taste",
  description:
    "what i build toward: constants, design directions with their primary sources, references, and the stack. from tetrastack.",
  alternates: {
    canonical: "/taste",
    types: { "text/markdown": "/taste.md" },
  },
};

// Convex entries refresh every five minutes; tetrastack and previews carry
// their own longer caches (see src/lib/tetrastack).
export const revalidate = 300;

/** Intro paragraphs that only point back at this page are left out here. */
const selfReference = /\]\(https:\/\/tetraslam\.world\/taste(?:\.md)?\)/;

export default async function TastePage() {
  const { stack, entries, index, previews } = await getTasteBook();
  const ctx = { index, previews };
  const extra = unreferenced(entries, stack);
  const contents = [
    ["constants", stack.taste.constants.items.length],
    ["the-bar", stack.taste.bar],
    ["directions", stack.directions.length],
    ["references", stack.taste.groups.length],
    ["collected", extra.length],
    ["stack", stack.stack.length],
    ["rejected", stack.rejected.tables.length],
  ].filter(([, present]) => present) as [string, unknown][];
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 taste-book motion-list">
      <PageHeader
        path="/taste"
        title="taste"
        subtitle=""
        action={
          <a href={TETRASTACK_URL} target="_blank" rel="noreferrer">
            tetrastack ↗
          </a>
        }
      />
      <div className="book-lede">
        {stack.taste.intro
          .filter((text) => !selfReference.test(text))
          .map((text) => (
            <Markdown key={text}>{text}</Markdown>
          ))}
        <Provenance stack={stack} />
      </div>
      <nav className="book-contents" aria-label="On this page">
        {contents.map(([id]) => (
          <a key={id} href={`#${id}`}>
            {id === "the-bar"
              ? "the bar"
              : id === "collected"
                ? "also collected"
                : id}
          </a>
        ))}
      </nav>
      <Constants stack={stack} />
      <TheBar stack={stack} ctx={ctx} />
      <Directions stack={stack} ctx={ctx} />
      <References stack={stack} ctx={ctx} />
      <AlsoCollected items={extra} />
      <Stack stack={stack} />
      <Rejected stack={stack} />
    </div>
  );
}
