"use client";

import { useMutation, useQuery } from "convex/react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { SortableList } from "@/components/sortable-list";
import {
  emptyTasteForm,
  TasteAdminForm,
  type TasteFormData,
} from "@/components/taste-admin-form";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function AdminTastePage() {
  const items = useQuery(api.taste.list, {});
  const create = useMutation(api.taste.create);
  const update = useMutation(api.taste.update);
  const remove = useMutation(api.taste.remove);
  const reorder = useMutation(api.taste.reorder);

  const [editing, setEditing] = useState<Id<"taste"> | "new" | null>(null);
  const [form, setForm] = useState<TasteFormData>(emptyTasteForm);

  // Extract unique tags from all entries
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    items?.forEach((item) => {
      if (item.tags) {
        for (const tag of item.tags) {
          tagSet.add(tag);
        }
      }
    });
    return Array.from(tagSet).sort();
  }, [items]);

  // Sort items by order
  const sortedItems = items
    ? [...items].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined)
          return a.order - b.order;
        if (a.order === undefined && b.order === undefined)
          return b.createdAt - a.createdAt;
        if (a.order !== undefined) return -1;
        return 1;
      })
    : [];

  const handleReorder = async (reordered: typeof sortedItems) => {
    await reorder({ ids: reordered.map((item) => item._id) });
  };

  const handleEdit = (item: NonNullable<typeof items>[0]) => {
    setEditing(item._id);
    setForm({
      title: item.title,
      url: item.url,
      content: item.content || "",
      designNotes: item.designNotes || "",
      screenshotUrls: item.screenshotUrls || [],
      tags: item.tags || [],
    });
  };

  const handleNew = () => {
    setEditing("new");
    setForm(emptyTasteForm);
  };

  const handleCancel = () => {
    setEditing(null);
    setForm(emptyTasteForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      title: form.title,
      url: form.url,
      content: form.content || undefined,
      designNotes: form.designNotes || undefined,
      screenshotUrls:
        form.screenshotUrls.length > 0 ? form.screenshotUrls : undefined,
      tags: form.tags.length > 0 ? form.tags : undefined,
    };

    if (editing === "new") {
      await create(data);
    } else if (editing) {
      await update({ id: editing, ...data });
    }
    handleCancel();
  };

  const handleDelete = async (id: Id<"taste">) => {
    if (confirm("Delete this taste entry?")) {
      await remove({ id });
    }
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">taste</h1>
        <button
          type="button"
          onClick={handleNew}
          className="px-4 py-2 bg-rose text-background rounded hover:bg-rose-deep transition-colors"
        >
          + add entry
        </button>
      </div>

      {editing && (
        <TasteAdminForm
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isNew={editing === "new"}
          allTags={allTags}
        />
      )}

      {!items ? (
        <p className="text-muted-foreground">loading...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">no taste entries yet</p>
      ) : (
        <SortableList
          items={sortedItems}
          onReorder={handleReorder}
          renderItem={(item) => (
            <div className="flex items-center gap-3 p-3 bg-surface border border-border rounded flex-1">
              {/* Thumbnail */}
              {item.screenshotUrls && item.screenshotUrls.length > 0 ? (
                <div className="relative w-16 h-12 rounded overflow-hidden shrink-0 border border-border">
                  <Image
                    src={item.screenshotUrls[0]}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                  {item.screenshotUrls.length > 1 && (
                    <span className="absolute bottom-0 right-0 bg-background/80 text-xs px-1 text-muted-foreground">
                      {item.screenshotUrls.length}
                    </span>
                  )}
                </div>
              ) : (
                <div className="w-16 h-12 rounded bg-background border border-border shrink-0 flex items-center justify-center">
                  <span className="text-[8px] text-muted-foreground/40 font-mono">
                    {getDomain(item.url).slice(0, 8)}
                  </span>
                </div>
              )}

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{item.title}</span>
                  {item.designNotes && (
                    <span className="text-xs text-rose/60 font-mono">
                      [notes]
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate max-w-md">
                  {getDomain(item.url)}
                </p>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 text-xs bg-background rounded border border-border text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0 ml-4">
                <button
                  type="button"
                  onClick={() => handleEdit(item)}
                  className="text-sm text-rose-deep hover:text-rose"
                >
                  edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item._id)}
                  className="text-sm text-muted-foreground hover:text-rose-deep"
                >
                  delete
                </button>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}
