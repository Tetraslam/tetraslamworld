import { TASTE_LIMITS } from "../../shared/taste";

export function inspectTasteFile(
  file: File,
  signal: AbortSignal,
  maxBytes = TASTE_LIMITS.fileBytes,
): Promise<{ width?: number; height?: number; poster?: Blob }> {
  if (file.size > maxBytes)
    throw new Error(
      `Use files smaller than ${Math.floor(maxBytes / 1024 / 1024)} MB.`,
    );
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = file.type.startsWith("image/") ? new window.Image() : null;
    const video = file.type.startsWith("video/")
      ? document.createElement("video")
      : null;
    const audio = file.type.startsWith("audio/")
      ? document.createElement("audio")
      : null;
    const element = image || video || audio;
    let done = false;
    const cleanup = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      URL.revokeObjectURL(url);
      if (video || audio) {
        (video || audio)?.pause();
        element?.removeAttribute("src");
        (video || audio)?.load();
      }
    };
    const finish = (value: {
      width?: number;
      height?: number;
      poster?: Blob;
    }) => {
      if (done) return;
      done = true;
      cleanup();
      resolve(value);
    };
    const fail = () => {
      if (done) return;
      done = true;
      cleanup();
      reject(
        new Error(
          "This file couldn’t be read. Check its format and try again.",
        ),
      );
    };
    const abort = () => {
      if (done) return;
      done = true;
      cleanup();
      reject(new DOMException("Upload cancelled", "AbortError"));
    };
    const timer = setTimeout(fail, 15000);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) {
      abort();
      return;
    }
    if (!element) {
      fail();
      return;
    }
    const ready = () => {
      const width = image?.naturalWidth || video?.videoWidth;
      const height = image?.naturalHeight || video?.videoHeight;
      if ((video || file.type === "image/gif") && width && height) {
        const canvas = document.createElement("canvas");
        canvas.width = Math.min(width, 960);
        canvas.height = Math.round((height * canvas.width) / width);
        canvas
          .getContext("2d")
          ?.drawImage(
            (image || video) as CanvasImageSource,
            0,
            0,
            canvas.width,
            canvas.height,
          );
        canvas.toBlob(
          (blob) => finish({ width, height, poster: blob ?? undefined }),
          "image/webp",
          0.9,
        );
      } else finish({ width, height });
    };
    element.onerror = fail;
    if (image) image.onload = ready;
    if (video) {
      video.muted = true;
      video.preload = "auto";
      video.onloadeddata = ready;
    }
    if (audio) {
      audio.preload = "metadata";
      audio.onloadedmetadata = () => finish({});
    }
    element.src = url;
  });
}
