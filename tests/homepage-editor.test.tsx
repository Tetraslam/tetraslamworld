// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { loadHomepage, saveHomepage } from "../src/app/admin/homepage/actions";
import HomepageEditor from "../src/app/admin/homepage/page";

vi.mock("../src/app/admin/homepage/actions", () => ({
  loadHomepage: vi.fn(),
  saveHomepage: vi.fn(),
}));
vi.mock("@/components/home-copy", () => ({
  HomeCopy: ({ body }: { body: string }) => <div>{body}</div>,
}));
const content = {
  heading: "hello",
  body: "saved bio",
  revision: 2,
  updatedAt: 100,
};
beforeEach(() => {
  vi.mocked(loadHomepage).mockResolvedValue({ ok: true, content });
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

async function editor() {
  const user = userEvent.setup();
  render(<HomepageEditor />);
  await waitFor(() =>
    expect(
      (screen.getByLabelText("heading") as HTMLInputElement).disabled,
    ).toBe(false),
  );
  return user;
}

test("failed saves preserve the draft and permit retry", async () => {
  vi.mocked(saveHomepage).mockResolvedValue({ ok: false, message: "offline" });
  const user = await editor();
  const body = screen.getByLabelText(/bio/);
  await user.clear(body);
  await user.type(body, "my unsaved bio");
  await user.click(screen.getByRole("button", { name: "save changes" }));
  await screen.findByText("offline");
  expect((body as HTMLTextAreaElement).value).toBe("my unsaved bio");
  expect(saveHomepage).toHaveBeenCalledWith({
    heading: "hello",
    body: "my unsaved bio",
    expectedRevision: 2,
  });
  expect(
    (screen.getByRole("button", { name: "save changes" }) as HTMLButtonElement)
      .disabled,
  ).toBe(false);
});

test("conflicting edits require review without discarding the draft", async () => {
  vi.mocked(saveHomepage).mockResolvedValueOnce({
    ok: false,
    code: "CONFLICT",
    message: "changed elsewhere",
  });
  const user = await editor();
  const heading = screen.getByLabelText("heading");
  await user.clear(heading);
  await user.type(heading, "my heading");
  await user.click(screen.getByRole("button", { name: "save changes" }));
  await screen.findByText("changed elsewhere");
  expect(
    (screen.getByRole("button", { name: "save changes" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  vi.mocked(loadHomepage).mockResolvedValue({
    ok: true,
    content: { ...content, heading: "their heading", revision: 3 },
  });
  await user.click(screen.getByRole("button", { name: "review latest" }));
  await user.click(
    await screen.findByRole("button", { name: "keep my draft" }),
  );
  expect((heading as HTMLInputElement).value).toBe("my heading");
  vi.mocked(saveHomepage).mockResolvedValue({
    ok: true,
    content: { ...content, heading: "my heading", revision: 4 },
  });
  await user.click(screen.getByRole("button", { name: "save changes" }));
  await screen.findByText("saved.");
  expect(saveHomepage).toHaveBeenLastCalledWith({
    heading: "my heading",
    body: "saved bio",
    expectedRevision: 3,
  });
});

test("a pending write locks fields and prevents repeated submission", async () => {
  let finish:
    | ((value: Awaited<ReturnType<typeof saveHomepage>>) => void)
    | undefined;
  vi.mocked(saveHomepage).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const user = await editor();
  await user.type(screen.getByLabelText("heading"), "!");
  await user.dblClick(screen.getByRole("button", { name: "save changes" }));
  expect(saveHomepage).toHaveBeenCalledTimes(1);
  expect(
    (screen.getByRole("button", { name: "saving…" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  await act(async () =>
    finish?.({
      ok: true,
      content: { ...content, heading: "hello!", revision: 3 },
    }),
  );
  await screen.findByText("saved.");
});

test("an abandoned load cannot overwrite an edited draft", async () => {
  let finish:
    | ((value: Awaited<ReturnType<typeof loadHomepage>>) => void)
    | undefined;
  vi.mocked(loadHomepage)
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValue({ ok: true, content });
  const user = userEvent.setup();
  render(
    <StrictMode>
      <HomepageEditor />
    </StrictMode>,
  );
  await waitFor(() =>
    expect(
      (screen.getByLabelText("heading") as HTMLInputElement).disabled,
    ).toBe(false),
  );
  await user.type(screen.getByLabelText("heading"), " draft");
  await act(async () =>
    finish?.({ ok: true, content: { ...content, heading: "old response" } }),
  );
  expect((screen.getByLabelText("heading") as HTMLInputElement).value).toBe(
    "hello draft",
  );
});

test("editing after a successful save reports a new unsaved draft", async () => {
  vi.mocked(saveHomepage).mockResolvedValue({
    ok: true,
    content: { ...content, heading: "hello!", revision: 3 },
  });
  const user = await editor();
  await user.type(screen.getByLabelText("heading"), "!");
  await user.click(screen.getByRole("button", { name: "save changes" }));
  await screen.findByText("saved.");
  await user.type(screen.getByLabelText(/bio/), " more");
  await screen.findByText("unsaved changes");
  expect(screen.queryByText("saved.")).toBeNull();
});
