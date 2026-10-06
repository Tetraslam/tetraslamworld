// @vitest-environment jsdom
import { Editor, getSchema } from "@tiptap/core";
import { expect, test } from "vitest";
import {
  blockInsertionPosition,
  writingExtensions,
  writingMarkdown,
} from "../shared/writing-extensions";

test.each([
  "![alt](writing-asset:original)",
  "![alt](writing-asset:original)\n*A caption.*",
  "- ![alt](writing-asset:original)\n- Another item",
  "[`linked code`](https://example.com) and **`bold code`**",
  "Before.\n\n<br>\n\nAfter.",
])("imported Markdown fits the actual editor schema: %s", (source) => {
  const manager = writingMarkdown();
  const parsed = manager.parse(source);
  const schema = getSchema(writingExtensions());
  expect(() => schema.nodeFromJSON(parsed).check()).not.toThrow();
  const editor = new Editor({
    element: document.createElement("div"),
    extensions: writingExtensions(),
    content: source,
    contentType: "markdown",
    enableContentCheck: true,
  });
  expect(manager.parse(editor.getMarkdown().trimEnd())).toEqual(parsed);
  editor.commands.setContent(editor.getMarkdown(), { contentType: "markdown" });
  expect(manager.parse(editor.getMarkdown().trimEnd())).toEqual(parsed);
  editor.destroy();
});

test("new and cleared documents remain normal editable paragraphs", () => {
  const editor = new Editor({
    element: document.createElement("div"),
    extensions: writingExtensions(),
    content: "",
    contentType: "markdown",
  });
  expect(editor.getJSON().content?.[0].type).toBe("paragraph");
  editor.commands.insertContent("A new note.");
  expect(editor.getText()).toBe("A new note.");
  editor.commands.clearContent();
  expect(editor.getJSON().content?.[0].type).toBe("paragraph");
  editor.commands.insertContent("Start again.");
  expect(editor.getText()).toBe("Start again.");
  editor.destroy();
});
test("inserting a rich block from a table places it outside the table and round-trips", () => {
  const editor = new Editor({
    element: document.createElement("div"),
    extensions: writingExtensions(),
    content: "| one | two |\n| --- | --- |\n| a | b |",
    contentType: "markdown",
  });
  editor.commands.setTextSelection(4);
  editor.commands.insertContentAt(blockInsertionPosition(editor), [
    { type: "writingBlock", attrs: { raw: '{"type":"gallery","items":[]}' } },
    { type: "paragraph" },
  ]);
  expect(editor.getJSON().content?.map((node) => node.type)).toContain(
    "writingBlock",
  );
  const saved = editor.getMarkdown();
  editor.commands.setContent(saved, { contentType: "markdown" });
  expect(
    editor.getJSON().content?.filter((node) => node.type === "writingBlock"),
  ).toHaveLength(1);
  editor.destroy();
});
test("unsupported table contents are preserved as source rather than stripped", () => {
  const source =
    "| picture |\n| --- |\n| ![alt](https://example.com/image.png) |";
  const manager = writingMarkdown();
  const parsed = manager.parse(source);
  expect(parsed.content?.[0].type).toBe("rawBlock");
  expect(manager.serialize(parsed)).toContain("https://example.com/image.png");
});
test("a batch of media blocks preserves every attachment and leaves a typing position", () => {
  const editor = new Editor({
    element: document.createElement("div"),
    extensions: writingExtensions(),
    content: "A paragraph.",
    contentType: "markdown",
  });
  editor.commands.insertContentAt(editor.state.selection.to, [
    ...["video", "image", "audio"].map((type) => ({
      type: "writingBlock",
      attrs: { raw: JSON.stringify({ type }) },
    })),
    { type: "paragraph" },
  ]);
  editor.commands.insertContent("After the attachments.");
  expect(
    editor.getJSON().content?.filter((node) => node.type === "writingBlock"),
  ).toHaveLength(3);
  expect(editor.getText()).toContain("A paragraph.");
  expect(editor.getText()).toContain("After the attachments.");
  editor.destroy();
});
