import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

type SourceNode = {
  type: string;
  position?: { start: { offset?: number }; end: { offset?: number } };
  children?: SourceNode[];
};

// Escape currency only in prose; code, URLs, HTML, and rich JSON stay intact.
export function currencySafeMarkdown(body: string) {
  const offsets: number[] = [];
  const visit = (node: SourceNode) => {
    const start = node.position?.start.offset,
      end = node.position?.end.offset;
    if (node.type === "text" && start !== undefined && end !== undefined)
      for (const match of body
        .slice(start, end)
        .matchAll(/(?<![\\$])\$(?=\d)/g))
        offsets.push(start + match.index);
    node.children?.forEach(visit);
  };
  visit(unified().use(remarkParse).use(remarkGfm).parse(body));
  for (const offset of offsets.sort((a, b) => b - a))
    body = `${body.slice(0, offset)}\\${body.slice(offset)}`;
  return body;
}
