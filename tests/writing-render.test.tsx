import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { portableMarkdown } from "../shared/writing-export";
import { currencySafeMarkdown } from "../shared/writing-math";
import { WritingProse } from "../src/components/writing/prose";

test("dollar amounts remain prose while explicit equations render", () => {
  const html = renderToStaticMarkup(
    <WritingProse
      body={
        "GDP is $29 trillion. [Growth](https://example.com) adds $2T to $4.4T.\n\nThe state $h$ and number $$2$$."
      }
    />,
  );
  expect(html).toContain("GDP is $29 trillion.");
  expect(html).toContain('href="https://example.com"');
  expect(html).toContain("adds $2T to $4.4T.");
  expect(html.match(/class="katex"/g)).toHaveLength(2);
});

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
test("currency handling does not rewrite code, destinations, or explicit math", () => {
  const source =
    '`$29` [price](https://example.com/$29) $$2$$ \\$29\n\n```writing\n{"fallback":"$29"}\n```';
  expect(currencySafeMarkdown(source)).toBe(source);
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
