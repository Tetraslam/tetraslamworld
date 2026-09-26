"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useEffect, useRef } from "react";
import { REDUCED_MOTION, SETTLE_EASING } from "@/lib/motion";

export function SoftImage(props: ImageProps) {
  const source =
    typeof props.src === "string"
      ? props.src
      : "default" in props.src
        ? props.src.default.src
        : props.src.src;
  return <ImageArrival key={source} {...props} />;
}

function ImageArrival({ onLoad, ...props }: ImageProps) {
  const painted = useRef(false);
  const animation = useRef<Animation | null>(null);
  const attach = useCallback((image: HTMLImageElement | null) => {
    // Hydration must not fade out an image the browser already painted.
    if (image) painted.current = image.complete && image.naturalWidth > 0;
  }, []);
  useEffect(() => {
    const preference = window.matchMedia(REDUCED_MOTION);
    const cancel = () => animation.current?.cancel();
    preference.addEventListener("change", cancel);
    return () => {
      cancel();
      preference.removeEventListener("change", cancel);
    };
  }, []);
  return (
    <Image
      {...props}
      ref={attach}
      onLoad={(event) => {
        if (!painted.current && !window.matchMedia(REDUCED_MOTION).matches) {
          animation.current = event.currentTarget.animate(
            [{ opacity: 0 }, { opacity: 1 }],
            { duration: 220, easing: SETTLE_EASING },
          );
        }
        painted.current = true;
        onLoad?.(event);
      }}
    />
  );
}
