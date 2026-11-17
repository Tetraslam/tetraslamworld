// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { useQuery } from "convex/react";
import { afterEach, expect, test, vi } from "vitest";
import { HomeIntroduction } from "../src/components/home-introduction";

vi.mock("convex/react", () => ({ useQuery: vi.fn() }));
vi.mock("@/components/home-copy", () => ({
  HomeCopy: ({ body }: { body: string }) => <div>{body}</div>,
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

test("the public bio never regresses through stale cache data or auth reconnects", () => {
  const initial = {
    heading: "server copy",
    body: "server body",
    now: "",
    nowUpdatedAt: 0,
    revision: 2,
    updatedAt: 100,
  };
  vi.mocked(useQuery).mockReturnValue({
    ...initial,
    heading: "stale cache",
    revision: 1,
  });
  const { rerender } = render(<HomeIntroduction initialContent={initial} />);
  expect(screen.getByRole("heading").textContent).toBe("server copy");
  vi.mocked(useQuery).mockReturnValue({
    ...initial,
    heading: "live edit",
    revision: 3,
  });
  rerender(<HomeIntroduction initialContent={initial} />);
  expect(screen.getByRole("heading").textContent).toBe("live edit");
  vi.mocked(useQuery).mockReturnValue(undefined);
  rerender(<HomeIntroduction initialContent={initial} />);
  expect(screen.getByRole("heading").textContent).toBe("live edit");
  vi.mocked(useQuery).mockReturnValue({
    ...initial,
    heading: "late response",
    revision: 2,
  });
  rerender(<HomeIntroduction initialContent={initial} />);
  expect(screen.getByRole("heading").textContent).toBe("live edit");
});

test("the now note shows when it was last changed, and hides when empty", () => {
  const base = {
    heading: "hi",
    body: "bio",
    now: "",
    nowUpdatedAt: 0,
    revision: 1,
    updatedAt: 1,
  };
  vi.mocked(useQuery).mockReturnValue(undefined);
  const { rerender } = render(<HomeIntroduction initialContent={base} />);
  expect(screen.queryByRole("complementary")).toBeNull();
  rerender(
    <HomeIntroduction
      initialContent={{
        ...base,
        now: "back in sf",
        nowUpdatedAt: Date.UTC(2026, 10, 17, 20),
        revision: 2,
      }}
    />,
  );
  const note = screen.getByRole("complementary");
  expect(note.textContent).toContain("back in sf");
  expect(note.querySelector("time")?.getAttribute("dateTime")).toBe(
    "2026-11-17T20:00:00.000Z",
  );
});
