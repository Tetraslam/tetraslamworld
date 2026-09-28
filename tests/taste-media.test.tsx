// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { TasteAsset } from "../src/components/taste/asset";
import { TastePreview } from "../src/components/taste/preview";

vi.mock("@/components/intent-link", () => ({
  IntentLink: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("../src/components/soft-image", () => ({
  SoftImage: ({ src, alt }: { src: string; alt: string }) => (
    // biome-ignore lint/performance/noImgElement: Isolate playback tests from Next image loading.
    <img src={src} alt={alt} />
  ),
}));
let reduced = false;
let observers: Array<(entries: IntersectionObserverEntry[]) => void> = [];
beforeEach(() => {
  reduced = false;
  observers = [];
  vi.stubGlobal("matchMedia", () => ({
    matches: reduced,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
        observers.push(callback);
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const clip = {
  id: "clip",
  kind: "video" as const,
  url: "https://example.com/clip.mp4",
  poster: "https://example.com/still.jpg",
  startSeconds: 2,
  endSeconds: 5,
};

test("index video is absent until intent, muted, and stops offscreen", async () => {
  const user = userEvent.setup();
  const { container } = render(
    <TastePreview
      asset={clip}
      title="Clip"
      href="/taste/clip"
      previewKey="clip-entry"
    />,
  );
  expect(container.querySelector("video")).toBeNull();
  await user.click(
    screen.getByRole("button", { name: "Play preview of Clip" }),
  );
  const video = container.querySelector("video");
  if (!video) throw new Error();
  expect(video.muted).toBe(true);
  expect(video.controls).toBe(false);
  fireEvent.loadedMetadata(video);
  expect(video.play).toHaveBeenCalled();
  act(() =>
    observers[0]([{ isIntersecting: false } as IntersectionObserverEntry]),
  );
  await waitFor(() => expect(container.querySelector("video")).toBeNull());
  expect(video.pause).toHaveBeenCalled();
  expect(video.hasAttribute("src")).toBe(false);
});

test("reduced motion prevents focus autoplay but keeps explicit playback", async () => {
  reduced = true;
  const user = userEvent.setup();
  const { container } = render(
    <TastePreview
      asset={clip}
      title="Clip"
      href="/taste/clip"
      previewKey="clip-entry"
    />,
  );
  act(() => screen.getByRole("link").focus());
  expect(container.querySelector("video")).toBeNull();
  await user.click(
    screen.getByRole("button", { name: "Play preview of Clip" }),
  );
  expect(container.querySelector("video")).not.toBeNull();
});

test("starting a second preview stops the first", async () => {
  const user = userEvent.setup();
  const { container } = render(
    <>
      <TastePreview
        asset={clip}
        title="One"
        href="/taste/one"
        previewKey="one"
      />
      <TastePreview
        asset={clip}
        title="Two"
        href="/taste/two"
        previewKey="two"
      />
    </>,
  );
  await user.click(screen.getByRole("button", { name: "Play preview of One" }));
  await user.click(screen.getByRole("button", { name: "Play preview of Two" }));
  expect(container.querySelectorAll("video")).toHaveLength(1);
  expect(
    screen.getByRole("button", { name: "Play preview of One" }),
  ).toBeTruthy();
});

test("interactive examples do not mount a frame until requested", async () => {
  const user = userEvent.setup();
  const { container } = render(
    <TasteAsset
      asset={{ id: "example", kind: "embed", url: "https://example.com/demo" }}
    />,
  );
  expect(container.querySelector("iframe")).toBeNull();
  await user.click(
    screen.getByRole("button", { name: "load interactive example" }),
  );
  const iframe = container.querySelector("iframe");
  expect(iframe?.getAttribute("sandbox")).not.toContain("allow-same-origin");
  expect(iframe?.src).toBe("https://example.com/demo");
  await user.click(screen.getByRole("button", { name: "close example" }));
  expect(container.querySelector("iframe")).toBeNull();
});

test("audio has native controls and never autoplays", () => {
  const { container } = render(
    <TasteAsset
      asset={{
        id: "sound",
        kind: "audio",
        url: "https://example.com/sound.mp3",
        transcript: "A spoken passage.",
      }}
    />,
  );
  const audio = container.querySelector("audio");
  expect(audio?.controls).toBe(true);
  expect(audio?.autoplay).toBe(false);
  expect(audio?.preload).toBe("none");
  expect(screen.getByText("transcript")).toBeTruthy();
});
