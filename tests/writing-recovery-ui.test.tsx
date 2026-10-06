// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { defaultPost } from "../shared/writing";
import { WritingStudio } from "../src/components/writing/studio";

const mocks = vi.hoisted(() => ({ recovery: vi.fn(), persist: vi.fn() }));
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: { id: "owner" } }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("../src/lib/writing/local", () => ({
  getRecovery: mocks.recovery,
  putRecovery: mocks.persist,
  beginRecoverySession: async () => ({ id: "session", release: () => {} }),
  clearRecoveredCopy: async () => {},
  getRecoveryCopies: async () => [],
}));
vi.mock("../src/components/writing/editor", () => ({
  WritingEditor: ({ body }: { body: string }) => (
    <textarea aria-label="Test body" value={body} readOnly />
  ),
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});
const post = {
  ...defaultPost("draft-12345678"),
  title: "A draft",
  body: "Server text.",
};
test("a clean old cache does not overwrite a newer server revision", async () => {
  mocks.recovery.mockResolvedValue({
    post: { ...post, body: "Old cached text." },
    baseRevision: "old",
    savedAt: 1,
    dirty: false,
  });
  mocks.persist.mockResolvedValue(undefined);
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({ post, revision: "new" })),
  );
  render(<WritingStudio id={post.id} />);
  await screen.findByDisplayValue("Server text.");
  expect(screen.queryByText(/another edit needs/)).toBeNull();
});
test("an unavailable writing service still opens a retained local recovery copy", async () => {
  mocks.recovery.mockResolvedValue({
    post: { ...post, body: "Unsynced local text." },
    baseRevision: "old",
    savedAt: 1,
    dirty: true,
  });
  mocks.persist.mockResolvedValue(undefined);
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  render(<WritingStudio id={post.id} />);
  await screen.findByDisplayValue("Unsynced local text.");
  expect(
    await screen.findByText(/Opened your local recovery copy/),
  ).toBeTruthy();
});
