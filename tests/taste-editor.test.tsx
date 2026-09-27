// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getFunctionName } from "convex/server";
import { ConvexError } from "convex/values";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import AdminTastePage from "../src/app/admin/taste/page";

const mocks = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
  save: vi.fn(),
  create: vi.fn(),
  other: vi.fn(),
}));
vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  useQuery: () => mocks.rows,
  useConvex: () => ({ query: vi.fn() }),
  useMutation: (reference: Parameters<typeof getFunctionName>[0]) =>
    getFunctionName(reference) === "taste:saveEntry"
      ? mocks.save
      : getFunctionName(reference) === "taste:createEntry"
        ? mocks.create
        : mocks.other,
}));
vi.mock("@/components/sortable-list", () => ({
  SortableList: ({
    items,
    renderItem,
  }: {
    items: Array<{ _id: string }>;
    renderItem: (item: unknown) => ReactNode;
  }) => (
    <div>
      {items.map((item) => (
        <div key={item._id}>{renderItem(item)}</div>
      ))}
    </div>
  ),
}));
vi.mock("@/components/taste/entry", () => ({ TasteEntryView: () => null }));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
beforeEach(() => {
  mocks.rows = [
    {
      _id: "entry-id",
      title: "A reference",
      url: "https://example.com",
      content: "original description",
      designNotes: "original notes",
      screenshotUrls: ["https://example.com/image.jpg"],
      tags: ["aesthetic"],
      createdAt: 1,
      revision: 3,
    },
  ];
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

test("a rejected save retains the complete editable draft", async () => {
  mocks.save.mockRejectedValue(
    new ConvexError({
      code: "CONFLICT",
      message: "changed in another session",
    }),
  );
  const user = userEvent.setup();
  render(<AdminTastePage />);
  await user.click(screen.getByRole("button", { name: "edit" }));
  await user.clear(screen.getByLabelText("title"));
  await user.type(screen.getByLabelText("title"), "my revised title");
  await user.click(screen.getByRole("button", { name: "save changes" }));
  await screen.findByText("changed in another session");
  expect((screen.getByLabelText("title") as HTMLInputElement).value).toBe(
    "my revised title",
  );
  expect(
    (screen.getByLabelText(/your notes/) as HTMLTextAreaElement).value,
  ).toBe("original notes");
  expect(mocks.save).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "entry-id",
      expectedRevision: 3,
      entry: expect.objectContaining({
        title: "my revised title",
        media: [
          expect.objectContaining({ url: "https://example.com/image.jpg" }),
        ],
      }),
    }),
  );
});

test("new entries start as drafts and support a detail without a source URL", async () => {
  mocks.create.mockResolvedValue("new-id");
  const user = userEvent.setup();
  render(<AdminTastePage />);
  await user.click(screen.getByRole("button", { name: "add entry" }));
  expect(
    (screen.getByLabelText("publish this entry") as HTMLInputElement).checked,
  ).toBe(false);
  await user.type(screen.getByLabelText("title"), "The hinge");
  await user.selectOptions(screen.getByLabelText("scope"), "detail");
  await user.type(screen.getByLabelText("part of / context"), "A lamp");
  await user.click(screen.getByRole("button", { name: "create entry" }));
  await waitFor(() =>
    expect(mocks.create).toHaveBeenCalledWith({
      entry: expect.objectContaining({
        scope: "detail",
        context: "A lamp",
        url: "",
        published: false,
      }),
    }),
  );
});
