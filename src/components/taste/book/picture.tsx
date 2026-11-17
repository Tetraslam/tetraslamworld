import type { CSSProperties } from "react";
import { SoftImage } from "@/components/soft-image";
import type { Picture } from "../../../../shared/taste-book";
import { imageUnoptimized } from "../text";

/**
 * An image in a frame that already has its final shape, so nothing moves when
 * it arrives. `ratio` crops to a fixed shape; without it the frame takes the
 * image's own proportions, within bounds.
 */
export function PictureFrame({
  picture,
  ratio,
  sizes,
  className = "",
  priority = false,
  fill = false,
}: {
  picture: Picture;
  ratio?: number;
  /** Take the parent's shape (a grid cell) instead of reserving one. */
  fill?: boolean;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  // Guessed sizes get a fixed screenshot shape, cropped from the top.
  const crop = ratio ?? (picture.exact ? undefined : 16 / 10);
  const shape =
    crop ??
    Math.max(0.6, Math.min(2.4, picture.width / Math.max(1, picture.height)));
  return (
    <span
      className={`book-picture ${crop ? "book-picture-crop" : ""} ${className}`}
      style={
        fill
          ? undefined
          : ({ aspectRatio: shape, "--ratio": shape } as CSSProperties)
      }
    >
      <SoftImage
        src={picture.src}
        alt={picture.alt}
        fill
        sizes={sizes}
        priority={priority}
        className={crop ? "object-cover object-top" : "object-contain"}
        unoptimized={
          picture.origin === "entry" ? imageUnoptimized(picture.src) : false
        }
      />
    </span>
  );
}

/** Where an image came from, linked when possible. */
export function Credit({
  picture,
  redundantWith = [],
}: {
  picture: Picture;
  /** Names already on screen; a credit that repeats one says nothing. */
  redundantWith?: string[];
}) {
  const credit = picture.credit?.toLowerCase();
  if (!credit) return null;
  const squash = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (
    redundantWith.some(
      (name) =>
        name &&
        (squash(name).includes(squash(credit)) ||
          squash(credit).includes(squash(name))),
    )
  )
    return null;
  return picture.creditUrl ? (
    <a
      className="book-credit"
      href={picture.creditUrl}
      target="_blank"
      rel="noreferrer"
    >
      {picture.credit}
    </a>
  ) : (
    <span className="book-credit">{picture.credit}</span>
  );
}

export function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
