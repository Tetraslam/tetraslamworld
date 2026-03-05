"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { MultiImageUpload } from "@/components/multi-image-upload";
import { TagInput } from "@/components/tag-input";
import { api } from "../../convex/_generated/api";

export interface TasteFormData {
  title: string;
  url: string;
  content: string;
  designNotes: string;
  screenshotUrls: string[];
  tags: string[];
}

export const emptyTasteForm: TasteFormData = {
  title: "",
  url: "",
  content: "",
  designNotes: "",
  screenshotUrls: [],
  tags: [],
};

interface TasteAdminFormProps {
  form: TasteFormData;
  setForm: (form: TasteFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isNew: boolean;
  allTags: string[];
}

export function TasteAdminForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  isNew,
  allTags,
}: TasteAdminFormProps) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const [capturing, setCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const isValidUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  const handleCapture = async () => {
    if (!isValidUrl(form.url)) return;

    setCapturing(true);
    setCaptureError(null);

    try {
      const res = await fetch(
        `/api/screenshot?url=${encodeURIComponent(form.url)}`,
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Capture failed: ${res.status}`);
      }

      const blob = await res.blob();
      const uploadUrl = await generateUploadUrl();
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type || "image/png" },
        body: blob,
      });

      if (!uploadResult.ok) throw new Error("Upload failed");

      const { storageId } = await uploadResult.json();
      const urlResponse = await fetch(`/api/storage?id=${storageId}`);
      const { url: convexUrl } = await urlResponse.json();

      if (convexUrl) {
        setForm({
          ...form,
          screenshotUrls: [...form.screenshotUrls, convexUrl],
        });
      }
    } catch (err) {
      setCaptureError(
        err instanceof Error ? err.message : "Failed to capture screenshot",
      );
    } finally {
      setCapturing(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="p-4 bg-surface border border-border rounded space-y-4"
    >
      <div>
        <label className="block text-sm text-muted-foreground mb-1">
          title *
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          placeholder="e.g., Shader Park"
          className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50"
        />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">
          url *
        </label>
        <input
          type="url"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          required
          placeholder="https://example.com"
          className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50"
        />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">
          description
        </label>
        <textarea
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          rows={3}
          placeholder="human-readable description (markdown supported)"
          className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">
          design notes (for claudes)
        </label>
        <textarea
          value={form.designNotes}
          onChange={(e) => setForm({ ...form, designNotes: e.target.value })}
          rows={4}
          placeholder="structured design takeaways for AI agents, e.g.:&#10;- spring animations on hover states&#10;- muted color palette with one high-contrast accent&#10;- generous whitespace, content-first layout"
          className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50 resize-none font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground/60 mt-1">
          markdown supported. use bullet points for specific patterns to
          reference.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm text-muted-foreground">
            screenshots
          </label>
          <button
            type="button"
            onClick={handleCapture}
            disabled={capturing || !isValidUrl(form.url)}
            className="px-3 py-1 text-xs bg-rose/10 text-rose rounded hover:bg-rose/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {capturing ? "capturing..." : "capture from url"}
          </button>
        </div>
        {captureError && (
          <p className="text-xs text-red-400 mb-2">{captureError}</p>
        )}
        <MultiImageUpload
          value={form.screenshotUrls}
          onChange={(urls) => setForm({ ...form, screenshotUrls: urls })}
        />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">tags</label>
        <TagInput
          tags={form.tags}
          allTags={allTags}
          onChange={(tags) => setForm({ ...form, tags })}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-rose text-background rounded hover:bg-rose-deep transition-colors"
        >
          {isNew ? "create" : "save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-border rounded hover:border-rose/50 transition-colors"
        >
          cancel
        </button>
      </div>
    </form>
  );
}
