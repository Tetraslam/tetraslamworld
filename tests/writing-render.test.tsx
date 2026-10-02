import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { portableMarkdown } from "../shared/writing-export";
import { WritingProse } from "../src/components/writing/prose";

test("footnotes stay navigable after HTML sanitization", () => {
  const html = renderToStaticMarkup(
    <WritingProse body={"A sentence[^1].\n\n[^1]: Its source."} />,
  );
  const ids = new Set(
    [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]),
  );
  for (const [, target] of html.matchAll(/href="#([^"]+)"/g))
    expect(ids.has(target)).toBe(true);
  expect(html).toContain("Its source.");
});
test("raw HTML cannot execute scripts or javascript links", () => {
  const html = renderToStaticMarkup(
    <WritingProse
      body={
        '<script>alert(1)</script>\n\n<a href="javascript:alert(1)">hello</a>'
      }
    />,
  );
  expect(html).not.toContain("<script");
  expect(html).not.toContain("javascript:");
  expect(html).toContain("hello");
});
test("rich content has a portable feed representation", () => {
  const body =
    '```writing\n{"type":"interactive","name":"station-spacing","version":1,"fallback":"Walking distance increases with spacing."}\n```';
  expect(portableMarkdown(body)).toBe(
    "Walking distance increases with spacing.",
  );
});
