import {
  type AnyExtension,
  type Editor,
  InputRule,
  type JSONContent,
  mergeAttributes,
  Node,
} from "@tiptap/core";
import Code from "@tiptap/extension-code";
import Image from "@tiptap/extension-image";
import { BlockMath, InlineMath } from "@tiptap/extension-mathematics";
import Paragraph from "@tiptap/extension-paragraph";
import {
  Table,
  TableCell,
  TableHeader,
  TableKit,
} from "@tiptap/extension-table";
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
  priority: 50,
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
  parseMarkdown: (token) =>
    !token.block && /^<br\s*\/?>(?:\s*)$/i.test(token.raw || "")
      ? { type: "hardBreak" }
      : {
          type: token.block ? "rawBlock" : "rawInline",
          attrs: { raw: token.raw },
        },
  renderMarkdown: (node) => node.attrs?.raw ?? "",
});
export const RawInline = Node.create({
  name: "rawInline",
  group: "inline",
  inline: true,
  atom: true,
  priority: 50,
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
    StarterKit.configure({
      link: { openOnClick: false },
      paragraph: false,
      code: false,
    }),
    Code.extend({ excludes: "" }),
    Paragraph.extend({
      parseMarkdown(token, helpers) {
        const tokens = token.tokens || [];
        if (tokens.length === 1 && tokens[0].type === "image")
          return { type: "paragraph", content: helpers.parseInline(tokens) };
        return (
          this.parent?.(token, helpers) || {
            type: "paragraph",
            content: helpers.parseInline(tokens),
          }
        );
      },
    }),
    Image.extend({
      renderHTML({ HTMLAttributes }) {
        return [
          "img",
          { ...HTMLAttributes, src: mediaUrl(HTMLAttributes.src || "") },
        ];
      },
    }).configure({ inline: true }),
    TableKit.configure({ table: false, tableCell: false, tableHeader: false }),
    Table.extend({
      parseMarkdown(token, helpers) {
        const result = this.parent?.(token, helpers) as JSONContent;
        const unsupported = (node: JSONContent): boolean =>
          ["image", "writingBlock", "blockMath"].includes(node.type || "") ||
          ((node.type === "tableCell" || node.type === "tableHeader") &&
            (node.content?.length !== 1 ||
              node.content[0].type !== "paragraph")) ||
          !!node.content?.some(unsupported);
        return result && !unsupported(result)
          ? result
          : { type: "rawBlock", attrs: { raw: token.raw || "" } };
      },
    }).configure({ resizable: false, renderWrapper: true }),
    TableCell.extend({ content: "paragraph" }),
    TableHeader.extend({ content: "paragraph" }),
    TaskList,
    TaskItem.configure({ nested: true }),
    BlockMath.extend({
      markdownTokenizer: {
        name: "blockMath",
        level: "block",
        start: (src) => src.search(/^\$\$\r?\n/m),
        tokenize(src) {
          const match = /^\$\$\r?\n([\s\S]*?)\r?\n\$\$(?:\r?\n|$)/.exec(src);
          return match
            ? { type: "blockMath", raw: match[0], latex: match[1].trim() }
            : undefined;
        },
      },
    }).configure({
      katexOptions: { throwOnError: false, trust: false },
      onClick: (node, position) =>
        editMath?.(node.attrs.latex, position, false),
    }),
    InlineMath.extend({
      markdownTokenizer: {
        name: "inlineMath",
        level: "inline",
        start: (src) => src.indexOf("$"),
        tokenize(src) {
          const match =
            /^\$\$([^$\n]+)\$\$/.exec(src) ||
            /^\$(?![\d$\s])([^$\n]+)\$(?![\d$])/.exec(src);
          return match
            ? { type: "inlineMath", raw: match[0], latex: match[1].trim() }
            : undefined;
        },
      },
      renderMarkdown: (node) => `$$${node.attrs?.latex || ""}$$`,
      addInputRules() {
        return [
          /(?<!\$)\$\$([^$\n]+)\$\$$/,
          /(?<!\$)\$(?![\d$\s])([^$\n]+)\$$/,
        ].map(
          (find) =>
            new InputRule({
              find,
              handler: ({ state, range, match }) => {
                state.tr.replaceWith(
                  range.from,
                  range.to,
                  this.type.create({ latex: match[1] }),
                );
              },
            }),
        );
      },
    }).configure({
      katexOptions: { throwOnError: false, trust: false },
      onClick: (node, position) => editMath?.(node.attrs.latex, position, true),
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
export function blockInsertionPosition(
  editor: Editor,
  position = editor.state.selection.to,
) {
  const resolved = editor.state.doc.resolve(position);
  for (let depth = resolved.depth; depth > 0; depth--)
    if (resolved.node(depth).type.name === "table")
      return resolved.after(depth);
  return position;
}
