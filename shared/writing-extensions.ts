import { type AnyExtension, mergeAttributes, Node } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import Mathematics from "@tiptap/extension-mathematics";
import { TableKit } from "@tiptap/extension-table";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { Markdown, MarkdownManager } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { mediaUrl } from "./writing";

// The complete original JSON is the attribute. Unknown types/keys are never
// reconstructed from a UI's known fields, so future blocks survive older editors.
export const WritingBlockNode = Node.create({
  name: "writingBlock",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return { raw: { default: "{}" } };
  },
  parseHTML() {
    return [{ tag: "div[data-writing-block]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-writing-block": "" }),
      "writing block",
    ];
  },
  markdownTokenName: "writingBlock",
  markdownTokenizer: {
    name: "writingBlock",
    level: "block",
    start: (src) => src.indexOf("```writing"),
    tokenize(src) {
      const match = /^```writing\r?\n([\s\S]*?)\r?\n```(?:\r?\n|$)/.exec(src);
      return match
        ? { type: "writingBlock", raw: match[0], text: match[1] }
        : undefined;
    },
  },
  parseMarkdown: (token) => ({
    type: "writingBlock",
    attrs: { raw: token.text },
  }),
  renderMarkdown: (node) => `\`\`\`writing\n${node.attrs?.raw ?? "{}"}\n\`\`\``,
});
export const RawBlock = Node.create({
  name: "rawBlock",
  group: "block",
  atom: true,
  draggable: true,
  priority: 1100,
  addAttributes() {
    return { raw: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "div[data-raw-markdown]" }];
  },
  renderHTML({ node }) {
    return ["pre", { "data-raw-markdown": "" }, node.attrs.raw];
  },
  markdownTokenName: "html",
  parseMarkdown: (token) => ({
    type: token.block ? "rawBlock" : "rawInline",
    attrs: { raw: token.raw },
  }),
  renderMarkdown: (node) => node.attrs?.raw ?? "",
});
export const RawInline = Node.create({
  name: "rawInline",
  group: "inline",
  inline: true,
  atom: true,
  priority: 1100,
  addAttributes() {
    return { raw: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "span[data-raw-markdown]" }];
  },
  renderHTML({ node }) {
    return ["span", { "data-raw-markdown": "" }, node.attrs.raw];
  },
  renderMarkdown: (node) => node.attrs?.raw ?? "",
});
export const FootnoteReference = Node.create({
  name: "footnoteReference",
  group: "inline",
  inline: true,
  atom: true,
  addAttributes() {
    return { id: { default: "1" } };
  },
  parseHTML() {
    return [{ tag: "sup[data-footnote]" }];
  },
  renderHTML({ node }) {
    return ["sup", { "data-footnote": node.attrs.id }, `[${node.attrs.id}]`];
  },
  markdownTokenizer: {
    name: "footnoteReference",
    level: "inline",
    start: (src) => src.indexOf("[^"),
    tokenize(src) {
      const match = /^\[\^([\w-]+)\](?!:)/.exec(src);
      return match
        ? { type: "footnoteReference", raw: match[0], id: match[1] }
        : undefined;
    },
  },
  parseMarkdown: (token) => ({
    type: "footnoteReference",
    attrs: { id: token.id },
  }),
  renderMarkdown: (node) => `[^${node.attrs?.id}]`,
});
export const FootnoteDefinition = Node.create({
  name: "footnoteDefinition",
  group: "block",
  content: "inline*",
  defining: true,
  addAttributes() {
    return { id: { default: "1" } };
  },
  parseHTML() {
    return [{ tag: "p[data-footnote-definition]" }];
  },
  renderHTML({ node }) {
    return [
      "p",
      {
        "data-footnote-definition": node.attrs.id,
        class: "writing-footnote-definition",
      },
      0,
    ];
  },
  markdownTokenizer: {
    name: "footnoteDefinition",
    level: "block",
    start: (src) => src.indexOf("[^"),
    tokenize(src, _tokens, lexer) {
      const match =
        /^\[\^([\w-]+)\]:[ \t]*([^\n]*(?:\n(?: {4}|\t)[^\n]*)*)(?:\n|$)/.exec(
          src,
        );
      if (!match) return;
      const text = match[2].replace(/\n(?: {4}|\t)/g, "\n");
      return {
        type: "footnoteDefinition",
        raw: match[0],
        id: match[1],
        tokens: lexer.inlineTokens(text),
      };
    },
  },
  parseMarkdown: (token, helpers) => ({
    type: "footnoteDefinition",
    attrs: { id: token.id },
    content: helpers.parseInline(token.tokens || []),
  }),
  renderMarkdown: (node, helpers) =>
    `[^${node.attrs?.id}]: ${helpers.renderChildren(node.content || []).replaceAll("\n", "\n    ")}`,
});
export function writingExtensions(
  block: AnyExtension = WritingBlockNode,
  editMath?: (latex: string, position: number, inline: boolean) => void,
) {
  return [
    StarterKit.configure({ link: { openOnClick: false } }),
    Image.extend({
      renderHTML({ HTMLAttributes }) {
        return [
          "img",
          { ...HTMLAttributes, src: mediaUrl(HTMLAttributes.src || "") },
        ];
      },
    }),
    TableKit.configure({ table: { resizable: false } }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Mathematics.configure({
      katexOptions: { throwOnError: false, trust: false },
      inlineOptions: {
        onClick: (node, position) =>
          editMath?.(node.attrs.latex, position, true),
      },
      blockOptions: {
        onClick: (node, position) =>
          editMath?.(node.attrs.latex, position, false),
      },
    }),
    block,
    RawBlock,
    RawInline,
    FootnoteReference,
    FootnoteDefinition,
    Markdown,
  ];
}
export function writingMarkdown() {
  return new MarkdownManager({ extensions: writingExtensions() });
}
