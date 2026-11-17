export const DEFAULT_HOME = {
  heading: "hi, i’m shresht.",
  body: "i’m shresht bhowmick, also known as tetraslam. i build software and robots, work on machine intelligence, and imagine worlds.\n\ncurrently, i’m a member of technical staff at [aire](https://aire.ai). previously, i was at [natural](https://natural.com), the [mit media lab](https://media.mit.edu), and [mosaic](https://mosaic.so).\n\nthis is where i keep [my work](/work), [my writing](/blog), and [things i find beautiful](/taste). you can also meet [my friends](/friends) or wander through [places i’ve been](/travel).",
  now: "",
  nowUpdatedAt: 0,
  revision: 0,
  updatedAt: 0,
};

export type HomeContent = typeof DEFAULT_HOME;
export const HOME_LIMITS = { heading: 120, body: 6000, now: 600 };

// "updated nov 17" for this year, "updated nov 17, 2025" otherwise.
export function formatNowDate(timestamp: number, today = new Date()) {
  const date = new Date(timestamp);
  return date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
      timeZone: "America/Los_Angeles",
    })
    .toLowerCase();
}

export function validateHomeCopy(heading: string, body: string) {
  return (
    heading.trim().length > 0 &&
    heading.length <= HOME_LIMITS.heading &&
    body.trim().length > 0 &&
    body.length <= HOME_LIMITS.body
  );
}

export function parseAdminIds(...values: Array<string | undefined>) {
  return [
    ...new Set(
      values.flatMap((value) =>
        (value ?? "")
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean),
      ),
    ),
  ];
}
