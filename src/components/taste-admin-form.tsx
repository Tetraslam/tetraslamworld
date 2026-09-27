"use client";

import { useConvex, useMutation } from "convex/react";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { inspectTasteFile } from "@/lib/taste-upload";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  isWebUrl,
  TASTE_CATEGORIES,
  TASTE_LIMITS,
  TASTE_QUALITIES,
  type TasteDraft,
  type TasteMedia,
} from "../../shared/taste";
import { SoftImage } from "./soft-image";
import { TagInput } from "./tag-input";
import { imageUnoptimized } from "./taste/text";

export type TasteFormData = TasteDraft;
type Props = {
  form: TasteDraft;
  setForm: Dispatch<SetStateAction<TasteDraft>>;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
  isNew: boolean;
  allTags: string[];
  allQualities: string[];
  saving: boolean;
  onBusyChange: (busy: boolean) => void;
};

export function TasteAdminForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  isNew,
  allTags,
  allQualities,
  saving,
  onBusyChange,
}: Props) {
  const client = useConvex();
  const uploadUrl = useMutation(api.taste.generateUploadUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [captureTheme, setCaptureTheme] = useState("light");
  const request = useRef<AbortController | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      request.current?.abort();
    };
  }, []);
  const change = <K extends keyof TasteDraft>(key: K, value: TasteDraft[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));
  const patch = (id: string, value: Partial<TasteMedia>) =>
    setForm((previous) => ({
      ...previous,
      media: previous.media.map((asset) =>
        asset.id === id ? { ...asset, ...value } : asset,
      ),
    }));
  async function store(blob: Blob, signal: AbortSignal) {
    const destination = await uploadUrl();
    const response = await fetch(destination, {
      method: "POST",
      body: blob,
      headers: { "Content-Type": blob.type },
      signal,
    });
    if (!response.ok) throw new Error("The upload failed. Try again.");
    const { storageId } = (await response.json()) as {
      storageId: Id<"_storage">;
    };
    const url = await client.query(api.files.getUrl, { storageId });
    if (!url) throw new Error("The uploaded file is unavailable.");
    return { url, storageId };
  }
  async function upload(file: File, signal: AbortSignal): Promise<TasteMedia> {
    const kind = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("audio/")
          ? "audio"
          : null;
    if (!kind) throw new Error("Choose an image, video, or audio file.");
    const info = await inspectTasteFile(file, signal);
    const stored = await store(file, signal);
    const poster = info.poster ? await store(info.poster, signal) : undefined;
    return {
      id: crypto.randomUUID(),
      kind,
      ...stored,
      width: info.width,
      height: info.height,
      poster: poster?.url,
      posterStorageId: poster?.storageId,
      animated: file.type === "image/gif",
      alt: "",
    };
  }
  async function run(task: (signal: AbortSignal) => Promise<void>) {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    onBusyChange(true);
    setError("");
    try {
      await task(controller.signal);
    } catch (error) {
      if (alive.current)
        setError(
          error instanceof Error ? error.message : "Couldn’t add this media.",
        );
    } finally {
      request.current = null;
      if (alive.current) {
        setBusy(false);
        onBusyChange(false);
      }
    }
  }
  function add(kind: TasteMedia["kind"]) {
    if (form.media.length >= TASTE_LIMITS.media) return;
    change("media", [
      ...form.media,
      {
        id: crypto.randomUUID(),
        kind,
        ...(kind === "text"
          ? { text: "", format: "markdown" as const }
          : { url: "" }),
      },
    ]);
  }
  function move(id: string, direction: number) {
    setForm((previous) => {
      const media = [...previous.media],
        index = media.findIndex((asset) => asset.id === id),
        target = index + direction;
      if (target < 0 || target >= media.length) return previous;
      [media[index], media[target]] = [media[target], media[index]];
      return { ...previous, media };
    });
  }
  return (
    <form className="taste-editor" onSubmit={onSubmit}>
      <fieldset disabled={saving || busy}>
        <div className="taste-editor-main">
          <label htmlFor="taste-title">title</label>
          <input
            id="taste-title"
            value={form.title}
            required
            maxLength={TASTE_LIMITS.title}
            onChange={(event) => change("title", event.target.value)}
          />
          <label htmlFor="taste-observation">
            the thing you noticed <span>(optional, one line)</span>
          </label>
          <textarea
            id="taste-observation"
            rows={2}
            maxLength={TASTE_LIMITS.observation}
            value={form.observation}
            onChange={(event) => change("observation", event.target.value)}
          />
          <div className="taste-editor-pair">
            <label>
              scope
              <select
                value={form.scope}
                onChange={(event) =>
                  change("scope", event.target.value as TasteDraft["scope"])
                }
              >
                <option value="whole">the whole thing</option>
                <option value="detail">a particular detail</option>
              </select>
            </label>
            <label>
              part of / context
              <input
                value={form.context}
                maxLength={200}
                onChange={(event) => change("context", event.target.value)}
              />
            </label>
          </div>
          <div className="taste-editor-pair">
            <label>
              creator / maker
              <input
                value={form.creator}
                maxLength={200}
                onChange={(event) => change("creator", event.target.value)}
              />
            </label>
            <label>
              year / period
              <input
                value={form.year}
                maxLength={200}
                onChange={(event) => change("year", event.target.value)}
              />
            </label>
          </div>
          <label htmlFor="taste-source">
            source URL <span>(optional)</span>
          </label>
          <input
            id="taste-source"
            type="url"
            value={form.url}
            onChange={(event) => change("url", event.target.value)}
            placeholder="https://"
          />
          <div className="taste-capture">
            <select
              aria-label="Website screenshot appearance"
              value={captureTheme}
              onChange={(event) => setCaptureTheme(event.target.value)}
            >
              <option value="light">light screenshot</option>
              <option value="dark">dark screenshot</option>
            </select>
            <button
              type="button"
              className="text-action"
              disabled={
                !isWebUrl(form.url) || form.media.length >= TASTE_LIMITS.media
              }
              onClick={() =>
                void run(async (signal) => {
                  const response = await fetch(
                    `/api/screenshot?url=${encodeURIComponent(form.url)}&theme=${captureTheme}`,
                    { signal },
                  );
                  if (!response.ok)
                    throw new Error(
                      "Couldn’t capture that website. You can upload a screenshot instead.",
                    );
                  const blob = await response.blob();
                  const asset = await upload(
                    new File([blob], "screenshot.png", {
                      type: blob.type || "image/png",
                    }),
                    signal,
                  );
                  if (alive.current)
                    setForm((previous) => ({
                      ...previous,
                      media: [...previous.media, asset],
                    }));
                })
              }
            >
              capture website
            </button>
          </div>
          <TasteSources
            sources={form.sources}
            onChange={(values) => change("sources", values)}
          />
          <fieldset className="taste-category-picker">
            <legend>what it is</legend>
            {TASTE_CATEGORIES.map((category) => (
              <label key={category.id}>
                <input
                  type="checkbox"
                  checked={form.categories.includes(category.id)}
                  onChange={(event) =>
                    change(
                      "categories",
                      event.target.checked
                        ? [...form.categories, category.id]
                        : form.categories.filter(
                            (value) => value !== category.id,
                          ),
                    )
                  }
                />
                {category.label}
              </label>
            ))}
          </fieldset>
          <label htmlFor="taste-custom-categories">other categories</label>
          <TagInput
            id="taste-custom-categories"
            tags={form.categories.filter(
              (value) =>
                !TASTE_CATEGORIES.some((category) => category.id === value),
            )}
            allTags={[]}
            onChange={(values) =>
              change("categories", [
                ...form.categories.filter((value) =>
                  TASTE_CATEGORIES.some((category) => category.id === value),
                ),
                ...values,
              ])
            }
          />
          <label htmlFor="taste-qualities">what you notice</label>
          <TagInput
            id="taste-qualities"
            tags={form.qualities}
            allTags={[...new Set([...TASTE_QUALITIES, ...allQualities])]}
            onChange={(values) => change("qualities", values)}
          />
          <label htmlFor="taste-keywords">other search words</label>
          <TagInput
            id="taste-keywords"
            tags={form.tags}
            allTags={allTags}
            onChange={(values) => change("tags", values)}
          />
          <label htmlFor="taste-description">
            description <span>(markdown, optional)</span>
          </label>
          <textarea
            id="taste-description"
            rows={4}
            maxLength={TASTE_LIMITS.content}
            value={form.content}
            onChange={(event) => change("content", event.target.value)}
          />
          <label htmlFor="taste-notes">
            your notes <span>(markdown, optional)</span>
          </label>
          <textarea
            id="taste-notes"
            rows={5}
            maxLength={TASTE_LIMITS.notes}
            value={form.designNotes}
            onChange={(event) => change("designNotes", event.target.value)}
          />
        </div>
        <section className="taste-media-editor">
          <h2>media</h2>
          <label className="taste-upload-label">
            upload images, video, or audio
            <input
              type="file"
              accept="image/*,video/*,audio/*"
              multiple
              disabled={form.media.length >= TASTE_LIMITS.media}
              onChange={(event) => {
                const files = Array.from(event.currentTarget.files ?? []);
                event.currentTarget.value = "";
                if (form.media.length + files.length > TASTE_LIMITS.media) {
                  setError("An entry can have up to 24 media items.");
                  return;
                }
                void run(async (signal) => {
                  for (const file of files) {
                    const asset = await upload(file, signal);
                    if (alive.current)
                      setForm((previous) => ({
                        ...previous,
                        media: [...previous.media, asset],
                      }));
                  }
                });
              }}
            />
          </label>
          <div className="editorial-links">
            {(["image", "video", "audio", "embed", "text"] as const).map(
              (kind) => (
                <button
                  key={kind}
                  type="button"
                  className="text-action"
                  disabled={form.media.length >= TASTE_LIMITS.media}
                  onClick={() => add(kind)}
                >
                  add{" "}
                  {kind === "embed"
                    ? "interactive example"
                    : kind === "text"
                      ? "text / math"
                      : kind}
                </button>
              ),
            )}
          </div>
          {form.media.map((asset, index) => (
            <fieldset className="taste-asset-editor" key={asset.id}>
              <legend>
                {asset.kind} {index + 1}
              </legend>
              <div className="taste-asset-actions">
                <button
                  type="button"
                  className="text-action"
                  aria-pressed={
                    (form.coverId || form.media[0]?.id) === asset.id
                  }
                  onClick={() => change("coverId", asset.id)}
                >
                  {(form.coverId || form.media[0]?.id) === asset.id
                    ? "cover"
                    : "use as cover"}
                </button>
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(asset.id, -1)}
                  aria-label={`Move media ${index + 1} up`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={index === form.media.length - 1}
                  onClick={() => move(asset.id, 1)}
                  aria-label={`Move media ${index + 1} down`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm((previous) => ({
                      ...previous,
                      media: previous.media.filter(
                        (item) => item.id !== asset.id,
                      ),
                      coverId:
                        previous.coverId === asset.id ? "" : previous.coverId,
                    }))
                  }
                >
                  remove
                </button>
              </div>
              {isWebUrl(
                asset.poster ||
                  (asset.kind === "image" && !asset.animated
                    ? asset.url || ""
                    : ""),
              ) && (
                <div className="taste-editor-thumbnail">
                  <SoftImage
                    src={asset.poster || asset.url || ""}
                    alt={asset.alt || `Media ${index + 1} preview`}
                    fill
                    sizes="300px"
                    className="object-contain object-left"
                    unoptimized={imageUnoptimized(
                      asset.poster || asset.url || "",
                    )}
                  />
                </div>
              )}
              {asset.kind === "text" ? (
                <>
                  <label>
                    format
                    <select
                      value={asset.format ?? "markdown"}
                      onChange={(event) =>
                        patch(asset.id, {
                          format: event.target.value as TasteMedia["format"],
                        })
                      }
                    >
                      <option value="markdown">markdown</option>
                      <option value="code">code</option>
                      <option value="math">TeX math</option>
                    </select>
                  </label>
                  <label>
                    text
                    <textarea
                      rows={5}
                      maxLength={TASTE_LIMITS.text}
                      value={asset.text ?? ""}
                      onChange={(event) =>
                        patch(asset.id, { text: event.target.value })
                      }
                    />
                  </label>
                </>
              ) : (
                <label>
                  {asset.kind === "embed" ? "example URL" : "file URL"}
                  <input
                    type="url"
                    required
                    value={asset.url ?? ""}
                    onChange={(event) =>
                      patch(asset.id, {
                        url: event.target.value,
                        storageId: undefined,
                      })
                    }
                  />
                </label>
              )}
              {asset.kind !== "text" && (
                <>
                  <label>
                    still preview / poster URL
                    <input
                      type="url"
                      value={asset.poster ?? ""}
                      onChange={(event) =>
                        patch(asset.id, {
                          poster: event.target.value,
                          posterStorageId: undefined,
                        })
                      }
                    />
                  </label>
                  <label className="taste-poster-upload">
                    upload a poster
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0];
                        event.currentTarget.value = "";
                        if (file)
                          void run(async (signal) => {
                            const info = await inspectTasteFile(file, signal);
                            const image = await store(
                              info.poster ?? file,
                              signal,
                            );
                            if (alive.current)
                              patch(asset.id, {
                                poster: image.url,
                                posterStorageId: image.storageId,
                                width: asset.width ?? info.width,
                                height: asset.height ?? info.height,
                              });
                          });
                      }}
                    />
                  </label>
                </>
              )}
              <label>
                {asset.kind === "text"
                  ? "label (optional)"
                  : "image / recording description"}
                <input
                  value={asset.alt ?? ""}
                  maxLength={500}
                  onChange={(event) =>
                    patch(asset.id, { alt: event.target.value })
                  }
                />
              </label>
              <label>
                caption / annotation
                <textarea
                  rows={2}
                  maxLength={TASTE_LIMITS.caption}
                  value={asset.caption ?? ""}
                  onChange={(event) =>
                    patch(asset.id, { caption: event.target.value })
                  }
                />
              </label>
              <div className="taste-editor-pair">
                <label>
                  credit
                  <input
                    maxLength={200}
                    value={asset.credit ?? ""}
                    onChange={(event) =>
                      patch(asset.id, { credit: event.target.value })
                    }
                  />
                </label>
                <label>
                  credit URL
                  <input
                    type="url"
                    value={asset.creditUrl ?? ""}
                    onChange={(event) =>
                      patch(asset.id, { creditUrl: event.target.value })
                    }
                  />
                </label>
              </div>
              {asset.kind !== "text" && (
                <div className="taste-editor-pair">
                  <label>
                    width
                    <input
                      type="number"
                      min={1}
                      max={32000}
                      value={asset.width ?? ""}
                      onChange={(event) =>
                        patch(asset.id, {
                          width: event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        })
                      }
                    />
                  </label>
                  <label>
                    height
                    <input
                      type="number"
                      min={1}
                      max={32000}
                      value={asset.height ?? ""}
                      onChange={(event) =>
                        patch(asset.id, {
                          height: event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        })
                      }
                    />
                  </label>
                </div>
              )}
              {(asset.kind === "video" || asset.kind === "audio") && (
                <div className="taste-editor-pair">
                  <label>
                    start (seconds)
                    <input
                      type="number"
                      min={0}
                      max={86400}
                      step="any"
                      value={asset.startSeconds ?? ""}
                      onChange={(event) =>
                        patch(asset.id, {
                          startSeconds: event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        })
                      }
                    />
                  </label>
                  <label>
                    end (seconds)
                    <input
                      type="number"
                      min={0}
                      max={86400}
                      step="any"
                      value={asset.endSeconds ?? ""}
                      onChange={(event) =>
                        patch(asset.id, {
                          endSeconds: event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        })
                      }
                    />
                  </label>
                </div>
              )}
              {asset.kind === "image" && (
                <label className="taste-check">
                  <input
                    type="checkbox"
                    checked={asset.animated ?? false}
                    onChange={(event) =>
                      patch(asset.id, { animated: event.target.checked })
                    }
                  />
                  animated image (use a still poster)
                </label>
              )}
              {(asset.kind === "video" || asset.kind === "audio") && (
                <details className="taste-editor-extra">
                  <summary>transcript and captions</summary>
                  <label>
                    transcript
                    <textarea
                      rows={4}
                      maxLength={8000}
                      value={asset.transcript ?? ""}
                      onChange={(event) =>
                        patch(asset.id, { transcript: event.target.value })
                      }
                    />
                  </label>
                  {asset.kind === "video" && (
                    <>
                      <label>
                        WebVTT captions URL
                        <input
                          type="url"
                          value={asset.captionsUrl ?? ""}
                          onChange={(event) =>
                            patch(asset.id, { captionsUrl: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        caption language
                        <input
                          value={asset.captionsLanguage ?? "en"}
                          onChange={(event) =>
                            patch(asset.id, {
                              captionsLanguage: event.target.value,
                            })
                          }
                          placeholder="en"
                        />
                      </label>
                    </>
                  )}
                </details>
              )}
            </fieldset>
          ))}
        </section>
        <div className="taste-publication">
          <label className="taste-check">
            <input
              type="checkbox"
              checked={form.prominent}
              onChange={(event) => change("prominent", event.target.checked)}
            />
            give this entry more room in the collection
          </label>
          <label className="taste-check">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) => change("published", event.target.checked)}
            />
            publish this entry
          </label>
        </div>
      </fieldset>
      <output className="taste-editor-status">
        {busy ? "preparing media…" : error}
      </output>
      <div className="editorial-links">
        <button type="submit" className="text-action" disabled={saving || busy}>
          {saving ? "saving…" : isNew ? "create entry" : "save changes"}
        </button>
        <button type="button" onClick={onCancel} disabled={saving || busy}>
          cancel
        </button>
      </div>
    </form>
  );
}

function TasteSources({
  sources,
  onChange,
}: {
  sources: TasteDraft["sources"];
  onChange: (sources: TasteDraft["sources"]) => void;
}) {
  return (
    <div className="taste-source-editor">
      {sources.map((source, index) => (
        <div className="taste-editor-pair" key={source.id ?? source.url}>
          <label>
            source label
            <input
              value={source.label}
              onChange={(event) =>
                onChange(
                  sources.map((value, i) =>
                    i === index
                      ? { ...value, label: event.target.value }
                      : value,
                  ),
                )
              }
            />
          </label>
          <label>
            source URL
            <input
              type="url"
              value={source.url}
              onChange={(event) =>
                onChange(
                  sources.map((value, i) =>
                    i === index ? { ...value, url: event.target.value } : value,
                  ),
                )
              }
            />
          </label>
          <button
            type="button"
            className="text-action"
            onClick={() => onChange(sources.filter((_, i) => i !== index))}
          >
            remove source
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-action"
        disabled={sources.length >= 10}
        onClick={() =>
          onChange([
            ...sources,
            { id: crypto.randomUUID(), label: "", url: "" },
          ])
        }
      >
        add source
      </button>
    </div>
  );
}
