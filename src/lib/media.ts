/**
 * Shared image helpers. Previously copy-pasted across every content page.
 */

export const isGif = (url: string) => {
  const lower = url.toLowerCase();
  return lower.endsWith(".gif") || lower.includes("format=gif");
};

/** Tiny rose-tinted blur placeholder used by every next/image on the site. */
export const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAQMEAQUAAAAAAAAAAAAAAQIDBAAFBhEhEiIxQVH/xAAVAQEBAAAAAAAAAAAAAAAAAAADBP/EABkRAQADAQEAAAAAAAAAAAAAAAEAAhEhA//aAAwDAQACEQMRAD8AyTG8guNjvEW5Q3AttJ3zjpChpQ4I+g6pMnymXyM/Xp3kl6YkqkOrUoqWtRJJJJJJJJPJJNKUq7V+CJE9J//Z";
