"use client";

import { useTheme } from "next-themes";
import { artworkSource } from "@/lib/theme-art";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function ThemeControl() {
  const { theme, setTheme } = useTheme();
  function warmArtwork(open: boolean) {
    if (!open || !document.querySelector(".home-art")) return;
    for (const dark of [false, true]) {
      const image = new window.Image();
      image.src = artworkSource(
        dark,
        window.innerWidth,
        window.devicePixelRatio,
      );
    }
  }
  return (
    <DropdownMenu onOpenChange={warmArtwork}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="theme-trigger"
          aria-label="Change appearance"
          title="Change appearance"
        >
          <svg
            className="theme-sun"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
          </svg>
          <svg
            className="theme-moon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            aria-hidden="true"
          >
            <path d="M20 14.3A8.7 8.7 0 0 1 9.7 4 8.7 8.7 0 1 0 20 14.3Z" />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="appearance-menu">
        <DropdownMenuRadioGroup
          value={theme ?? "system"}
          onValueChange={setTheme}
        >
          <DropdownMenuRadioItem value="light">light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            follow system
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
