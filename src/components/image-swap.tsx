"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { REDUCED_MOTION, SETTLE_EASING } from "@/lib/motion";
import { SoftImage } from "./soft-image";

/** Keep the last decoded image underneath while the requested image arrives. */
export function ImageSwap(props: ImageProps & { src: string }) {
  const [displayed, setDisplayed] = useState({
    src: props.src,
    alt: props.alt,
  });
  const [failed, setFailed] = useState<string | null>(null);
  const animation = useRef<Animation | null>(null);
  const finish = useRef<(() => void) | null>(null);
  useEffect(() => {
    const preference = window.matchMedia(REDUCED_MOTION);
    const settle = () => {
      if (preference.matches) {
        animation.current?.cancel();
        finish.current?.();
      }
    };
    preference.addEventListener("change", settle);
    return () => {
      finish.current = null;
      animation.current?.cancel();
      preference.removeEventListener("change", settle);
    };
  }, []);
  return (
    <div className="image-swap">
      <SoftImage {...props} src={displayed.src} alt={displayed.alt} />
      {props.src !== displayed.src && (
        <Image
          {...props}
          key={props.src}
          alt=""
          aria-hidden="true"
          className={`${props.className ?? ""} image-swap-incoming`}
          onLoad={(event) => {
            setFailed(null);
            const image = event.currentTarget;
            const commit = () => {
              if (image.isConnected)
                setDisplayed({ src: props.src, alt: props.alt });
            };
            animation.current?.cancel();
            finish.current = commit;
            if (window.matchMedia(REDUCED_MOTION).matches) {
              commit();
              return;
            }
            const transition = image.animate([{ opacity: 0 }, { opacity: 1 }], {
              duration: 200,
              easing: SETTLE_EASING,
              fill: "forwards",
            });
            animation.current = transition;
            transition.onfinish = commit;
          }}
          onError={(event) => {
            setFailed(props.src);
            props.onError?.(event);
          }}
        />
      )}
      {failed === props.src && (
        <output className="image-swap-error">couldn’t load this image.</output>
      )}
    </div>
  );
}
