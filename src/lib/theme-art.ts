export function artworkSource(dark: boolean, width: number, density: number) {
  const suffix =
    width <= 600 ? (density > 2 ? "" : density > 1 ? "-medium" : "-small") : "";
  return `/terrace-${dark ? "night" : "day"}${suffix}.webp`;
}
