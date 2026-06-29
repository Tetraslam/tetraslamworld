"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { Markdown } from "@/components/markdown";
import { api } from "../../../../convex/_generated/api";

export default function AdminWetModePage() {
  const doc = useQuery(api.wetMode.get, {});
  const save = useMutation(api.wetMode.set);

  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Hydrate the textarea once the doc loads
  useEffect(() => {
    if (doc) setContent(doc.content);
  }, [doc]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await save({ content });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-rose">WET_MODE.md</h1>
          <p className="text-sm text-muted-foreground">
            edit the markdown shown at{" "}
            <a
              href="/WET_MODE.md"
              className="text-rose-deep hover:text-rose underline underline-offset-2"
            >
              /WET_MODE.md
            </a>
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || doc === undefined}
          className="px-4 py-2 bg-rose text-background rounded hover:bg-rose-deep transition-colors disabled:opacity-50"
        >
          {saving ? "saving..." : saved ? "saved" : "save"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            markdown
          </span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={28}
            placeholder="# write something..."
            className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-rose/50 resize-y font-mono text-sm"
          />
        </div>
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            preview
          </span>
          <div className="px-3 py-2 bg-surface/50 border border-border rounded min-h-[28rem]">
            {content.trim() ? (
              <Markdown content={content} />
            ) : (
              <p className="text-muted-foreground text-sm">nothing here yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
