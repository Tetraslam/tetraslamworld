import {
  WRITING_LIMITS,
  type WritingAsset,
  type WritingBlock,
} from "../../../shared/writing";
import { inspectTasteFile } from "../taste-upload";
import { saveUpload, type UploadRecord } from "./local";

const jobs = new Map<string, Promise<WritingBlock>>();
async function api(body: unknown) {
  const response = await fetch("/api/writing/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Upload could not finish.");
  return data;
}
async function hashFile(file: Blob, progress: (message: string) => void) {
  const { createSHA256 } = await import("hash-wasm");
  const hash = await createSHA256();
  hash.init();
  const reader = file.stream().getReader();
  let bytes = 0,
    last = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    hash.update(result.value);
    bytes += result.value.byteLength;
    if (Date.now() - last > 100) {
      progress(`preparing ${Math.round((bytes / file.size) * 100)}%`);
      last = Date.now();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  return hash.digest("hex");
}
function put(url: string, file: Blob, progress: (message: string) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("Content-Type", file.type);
    request.upload.onprogress = (event) =>
      progress(
        `uploading ${event.lengthComputable ? Math.round((event.loaded / event.total) * 100) : 0}%`,
      );
    request.onerror = () =>
      reject(
        new Error(
          "Upload interrupted. Your original is saved locally for retry.",
        ),
      );
    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error("Upload could not finish. Retry when connected."));
    request.send(file);
  });
}
async function transfer(
  file: Blob,
  name: string,
  progress: (message: string) => void,
): Promise<WritingAsset> {
  const sha256 = await hashFile(file, progress),
    intent = await api({
      filename: name,
      contentType: file.type,
      size: file.size,
      sha256,
    });
  await put(intent.url, file, progress);
  const { url: _url, ...complete } = intent;
  return api(complete);
}
export function processUpload(
  record: UploadRecord,
  progress: (message: string) => void,
): Promise<WritingBlock> {
  const existing = jobs.get(record.id);
  if (existing) return existing;
  const work = (async () => {
    if (record.file.size > WRITING_LIMITS.uploadBytes)
      throw new Error("Use files up to 512 MB.");
    if (!record.asset) {
      if (record.phase !== "uploaded") {
        const sha256 = await hashFile(record.file, progress);
        record.intent = await api({
          filename: record.name,
          contentType: record.file.type,
          size: record.file.size,
          sha256,
        });
        await saveUpload(record);
        await put(record.intent!.url, record.file, progress);
        record.phase = "uploaded";
        await saveUpload(record);
      }
      progress("verifying original and independent backup…");
      const { url: _url, ...intent } = record.intent!;
      record.asset = await api(intent);
      await saveUpload(record);
    }
    const file = new File([record.file], record.name, {
      type: record.file.type,
    });
    if (
      !record.poster &&
      (file.type.startsWith("video/") || file.type === "image/gif")
    ) {
      const info = await inspectTasteFile(
        file,
        new AbortController().signal,
        WRITING_LIMITS.uploadBytes,
      );
      record.width = info.width;
      record.height = info.height;
      if (info.poster)
        record.poster = await transfer(
          info.poster,
          `${record.name}.poster.webp`,
          progress,
        );
    }
    record.phase = "done";
    await saveUpload(record);
    const type = file.type.startsWith("video/")
      ? "video"
      : file.type.startsWith("audio/")
        ? "audio"
        : "image";
    return {
      type,
      src: `writing-asset:${record.asset!.id}`,
      alt: "",
      caption: "",
      ...(record.poster ? { poster: `writing-asset:${record.poster.id}` } : {}),
      ...(file.type === "image/gif" ? { animated: true } : {}),
      ...(record.width ? { width: record.width, height: record.height } : {}),
    };
  })().finally(() => jobs.delete(record.id));
  jobs.set(record.id, work);
  return work;
}
