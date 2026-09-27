"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SortableList } from "@/components/sortable-list";
import { TasteEntryView } from "@/components/taste/entry";
import { TasteAdminForm } from "@/components/taste-admin-form";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  emptyTasteDraft,
  isWebUrl,
  sortTaste,
  type TasteDraft,
  tasteCover,
  tasteHref,
  toTasteDraft,
  validateTaste,
} from "../../../../shared/taste";

function message(error: unknown) {
  return error instanceof ConvexError &&
    typeof error.data === "object" &&
    error.data &&
    "message" in error.data
    ? String(error.data.message)
    : "Couldn’t save that change. Your draft is still here; please try again.";
}

export default function AdminTastePage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const items = useQuery(api.taste.adminList, isAuthenticated ? {} : "skip");
  const create = useMutation(api.taste.createEntry),
    save = useMutation(api.taste.saveEntry),
    remove = useMutation(api.taste.deleteEntry),
    reorder = useMutation(api.taste.reorder);
  const [editing, setEditing] = useState<Id<"taste"> | "new" | null>(null);
  const [revision, setRevision] = useState(0);
  const [form, setForm] = useState<TasteDraft>(emptyTasteDraft);
  const [saving, setSaving] = useState(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState("");
  const [search, setSearch] = useState(""),
    [preview, setPreview] = useState(false);
  const [optimistic, setOptimistic] = useState<string[] | null>(null);
  const pending = useRef(false),
    previewTrigger = useRef<HTMLButtonElement | null>(null);
  const sorted = sortTaste(items ?? []);
  const signature = sorted.map((item) => item._id).join("|");
  useEffect(() => {
    if (optimistic && optimistic.join("|") === signature) setOptimistic(null);
  }, [optimistic, signature]);
  const ordered = optimistic
    ? [...sorted].sort(
        (a, b) => optimistic.indexOf(a._id) - optimistic.indexOf(b._id),
      )
    : sorted;
  const visible = ordered.filter((item) =>
    `${item.title} ${item.observation ?? ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  function edit(item: NonNullable<typeof items>[number]) {
    setForm(toTasteDraft(item));
    setRevision(item.revision ?? 0);
    setEditing(item._id);
    setError("");
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending.current || uploading || !editing) return;
    const invalid = validateTaste(form);
    if (invalid) {
      setError(invalid);
      return;
    }
    pending.current = true;
    setSaving(true);
    setError("");
    try {
      if (editing === "new") await create({ entry: form });
      else await save({ id: editing, expectedRevision: revision, entry: form });
      setEditing(null);
      setForm(emptyTasteDraft());
    } catch (error) {
      setError(message(error));
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }
  async function move(next: typeof sorted) {
    if (pending.current) return;
    pending.current = true;
    setSaving(true);
    setError("");
    setOptimistic(next.map((item) => item._id));
    try {
      await reorder({ ids: next.map((item) => item._id) });
    } catch (error) {
      setOptimistic(null);
      setError(message(error));
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }
  async function deleteEntry(item: NonNullable<typeof items>[number]) {
    if (pending.current || !confirm(`Delete “${item.title}”?`)) return;
    pending.current = true;
    setSaving(true);
    setError("");
    try {
      await remove({ id: item._id, expectedRevision: item.revision ?? 0 });
    } catch (error) {
      setError(message(error));
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }
  const row = (item: NonNullable<typeof items>[number]) => {
    const cover = tasteCover(item),
      image =
        cover?.kind === "image" && !cover.animated ? cover.url : cover?.poster;
    return (
      <div className="taste-admin-row">
        {image && (
          <span
            className="taste-admin-thumb"
            style={{ backgroundImage: `url(${JSON.stringify(image)})` }}
          />
        )}
        <div className="taste-admin-row-copy">
          <strong>{item.title}</strong>
          <span>
            {item.published === false
              ? "draft"
              : item.scope === "detail"
                ? "detail"
                : ""}
          </span>
        </div>
        <div className="editorial-links">
          <button type="button" onClick={() => edit(item)}>
            edit
          </button>
          {item.published !== false && (
            <a href={tasteHref(item)} target="_blank" rel="noreferrer">
              view ↗
            </a>
          )}
          <button type="button" onClick={() => void deleteEntry(item)}>
            delete
          </button>
        </div>
      </div>
    );
  };
  const draft = {
    ...form,
    _id: editing ?? "draft",
    createdAt: 0,
    media: form.media.filter((asset) =>
      asset.kind === "text"
        ? !!asset.text?.trim()
        : !!asset.url && isWebUrl(asset.url),
    ),
    title: form.title || "untitled draft",
  };
  return (
    <div className="taste-admin">
      <header className="taste-admin-header">
        <h1>taste</h1>
        <div className="editorial-links">
          <Link href="/admin/taste/guide">collection guide</Link>
          {editing ? (
            <button
              type="button"
              ref={previewTrigger}
              onClick={() => setPreview(true)}
              disabled={saving || uploading}
            >
              preview entry
            </button>
          ) : (
            <button
              type="button"
              className="text-action"
              disabled={!items || saving}
              onClick={() => {
                setForm(emptyTasteDraft());
                setEditing("new");
                setRevision(0);
                setError("");
              }}
            >
              add entry
            </button>
          )}
        </div>
      </header>
      {!isLoading && !isAuthenticated && (
        <p>sign in again to connect to the content backend.</p>
      )}
      {error && (
        <div className="taste-save-error" role="alert">
          <p>{error}</p>
          {editing &&
            editing !== "new" &&
            items?.some((item) => item._id === editing) && (
              <button
                type="button"
                className="text-action"
                onClick={() => {
                  const latest = items.find((item) => item._id === editing);
                  if (latest) edit(latest);
                }}
              >
                reload saved version (discard this draft)
              </button>
            )}
        </div>
      )}
      {editing ? (
        <TasteAdminForm
          key={editing}
          form={form}
          setForm={setForm}
          onSubmit={submit}
          onCancel={() => {
            setEditing(null);
            setError("");
          }}
          isNew={editing === "new"}
          saving={saving}
          onBusyChange={setUploading}
          allTags={[
            ...new Set(items?.flatMap((item) => item.tags ?? []) ?? []),
          ]}
          allQualities={[
            ...new Set(items?.flatMap((item) => item.qualities ?? []) ?? []),
          ]}
        />
      ) : !items ? (
        <output>loading collection…</output>
      ) : (
        <>
          <div className="collection-search">
            <input
              type="search"
              aria-label="Find an entry to edit"
              placeholder="find an entry"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <fieldset disabled={saving}>
            {search ? (
              visible.map((item) => <div key={item._id}>{row(item)}</div>)
            ) : (
              <SortableList items={visible} onReorder={move} renderItem={row} />
            )}
          </fieldset>
          {!visible.length && (
            <p>
              {search ? "no matching entries." : "your collection is empty."}
            </p>
          )}
        </>
      )}
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent
          className="taste-admin-preview"
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            previewTrigger.current?.focus();
          }}
        >
          <DialogTitle className="sr-only">Entry preview</DialogTitle>
          <TasteEntryView key={editing} entry={draft} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
