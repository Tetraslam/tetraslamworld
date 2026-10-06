// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { WritingEditor } from "../src/components/writing/editor";

const mocks = vi.hoisted(() => ({ upload: vi.fn(), save: vi.fn() }));
vi.mock("@tiptap/extension-drag-handle-react", () => ({ default: () => null }));
vi.mock("../src/lib/writing/local", () => ({
  saveUpload: mocks.save,
  getUploads: async () => [],
}));
vi.mock("../src/lib/writing/upload-client", () => ({
  processUpload: mocks.upload,
}));
const originalRects = Object.getOwnPropertyDescriptor(
    Range.prototype,
    "getClientRects",
  ),
  originalBounds = Object.getOwnPropertyDescriptor(
    Range.prototype,
    "getBoundingClientRect",
  );
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  for (const [key, value] of [
    ["getClientRects", originalRects],
    ["getBoundingClientRect", originalBounds],
  ] as const) {
    if (value) Object.defineProperty(Range.prototype, key, value);
    else Reflect.deleteProperty(Range.prototype, key);
  }
});
test("pasting an image uses the mounted editor rather than its initial null instance", async () => {
  mocks.save.mockResolvedValue(undefined);
  mocks.upload.mockResolvedValue({
    type: "image",
    src: "https://example.com/pasted.png",
    alt: "pasted image",
  });
  Object.defineProperty(Range.prototype, "getClientRects", {
    configurable: true,
    value: () => [],
  });
  Object.defineProperty(Range.prototype, "getBoundingClientRect", {
    configurable: true,
    value: () => new DOMRect(),
  });
  const changed = vi.fn();
  render(
    <WritingEditor
      body="A paragraph."
      owner="owner"
      postId="draft-12345678"
      onChange={changed}
      onUploadStatus={() => {}}
    />,
  );
  const body = await screen.findByRole("textbox", { name: "Post body" });
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", {
    value: {
      files: [new File(["pixels"], "paste.png", { type: "image/png" })],
      getData: () => "",
      types: ["Files"],
    },
  });
  fireEvent(body, event);
  await waitFor(() => expect(mocks.upload).toHaveBeenCalledTimes(1));
  await waitFor(() =>
    expect(
      changed.mock.calls.some(([source]) =>
        source.includes("https://example.com/pasted.png"),
      ),
    ).toBe(true),
  );
});
