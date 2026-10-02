import { expect, test } from "vitest";
import { writingMarkdown } from "../shared/writing-extensions";

test.each([
  "# Heading\n\nSome **bold** and *italic* text with [a link](https://example.com).\n\n> A quote",
  "- [ ] a task\n- [x] completed\n\n| a | b |\n| - | - |\n| 1 | 2 |",
  "An equation $e^{i\\pi}+1=0$.\n\n$$\nx^2+y^2=1\n$$",
  "A reference[^1].\n\n[^1]: The source of the claim.",
  '```writing\n{"type":"future-block","version":73,"unfamiliar":{"nested":[1,2]}}\n```',
  '<section data-custom="original"><p>Preserve this HTML.</p></section>',
])("editing preserves the document structure: %s", (source) => {
  const manager = writingMarkdown(),
    first = manager.parse(source),
    serialized = manager.serialize(first);
  expect(manager.parse(serialized)).toEqual(first);
  if (source.includes("future-block"))
    expect(serialized).toContain('"version":73');
  if (source.includes("data-custom"))
    expect(serialized).toContain('data-custom="original"');
});
