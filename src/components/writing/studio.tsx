"use client";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DraftAutosave,
  SaveFailure,
  type SaveStatus,
} from "@/lib/writing/autosave";
import { getRecovery, putRecovery } from "@/lib/writing/local";
import { slugify } from "../../../shared/taste";
import {
  defaultPost,
  hasPendingUploads,
  serializePost,
  type WritingEntry,
  type WritingPost,
} from "../../../shared/writing";
import { TagInput } from "../tag-input";
import { WritingEditor } from "./editor";
import { WritingArticle } from "./prose";

async function request(url: string, body?: unknown) {
  const response = await fetch(
    url,
    body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : { cache: "no-store" },
  );
  const data = await response
    .json()
    .catch(() => ({ message: "Couldn’t reach the writing service." }));
  if (!response.ok)
    throw new SaveFailure(
      data.error || "UNAVAILABLE",
      data.message || "Couldn’t complete this request.",
    );
  return data;
}
async function sourceHash(post: WritingPost) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(serializePost(post)),
      ),
    ),
  )
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}
function download(post: WritingPost) {
  let contents: string;
  try {
    contents = serializePost(post);
  } catch {
    contents = JSON.stringify(post, null, 2);
  }
  const url = URL.createObjectURL(new Blob([contents], { type: "text/plain" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${post.slug}.md`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function WritingStudio({
  id,
  newKind,
}: {
  id: string;
  newKind?: "note" | "essay";
}) {
  const { user } = useUser(),
    router = useRouter(),
    owner = user?.id;
  const [post, setPost] = useState<WritingPost>(),
    [entry, setEntry] = useState<WritingEntry>(),
    [status, setStatus] = useState<SaveStatus>("saved"),
    [message, setMessage] = useState(""),
    [mediaStatus, setMediaStatus] = useState("");
  const [preview, setPreview] = useState(false),
    [details, setDetails] = useState(false),
    [focus, setFocus] = useState(false),
    [busy, setBusy] = useState(false),
    [publishOpen, setPublishOpen] = useState(false),
    [schedule, setSchedule] = useState("");
  const [history, setHistory] = useState<Array<{
      sha: string;
      message: string;
      date: string;
    }> | null>(null),
    [historic, setHistoric] = useState<{
      post: WritingPost;
      sha: string;
    } | null>(null),
    [remote, setRemote] = useState<{
      post: WritingPost;
      revision: string;
    } | null>(null);
  const autosave = useRef<DraftAutosave | null>(null),
    alive = useRef(true),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const customSlug = useRef(!newKind);
  const lastGitAttempt = useRef(0);
  const endpoint = `/api/writing/${id}`;
  useEffect(() => {
    alive.current = true;
    if (!owner) return;
    let disposed = false;
    void (async () => {
      let loaded: {
        post: WritingPost;
        revision: string | null;
        entry?: WritingEntry;
      };
      try {
        loaded = await request(endpoint);
      } catch (error) {
        if (
          newKind &&
          error instanceof SaveFailure &&
          error.code === "NOT_FOUND"
        )
          loaded = { post: defaultPost(id, newKind), revision: null };
        else throw error;
      }
      const recovery = await getRecovery(owner, id).catch(() => undefined);
      const model = new DraftAutosave(
        loaded.post,
        loaded.revision,
        {
          send: (input) => request(endpoint, input),
          persist: (state) => putRecovery(owner, state),
          status: (state, detail) => {
            if (alive.current) {
              setStatus(state);
              if (detail) setMessage(detail);
            }
          },
        },
        recovery,
      );
      if (recovery && recovery.baseRevision !== loaded.revision) {
        if ((await sourceHash(recovery.post)) === loaded.revision)
          model.adoptRevision(loaded.revision!, false, loaded.post);
        else if (
          recovery.pending &&
          (await sourceHash(recovery.pending.post)) === loaded.revision
        )
          model.adoptRevision(loaded.revision!, true, loaded.post);
        else {
          model.hold();
          setRemote({ post: loaded.post, revision: loaded.revision! });
        }
      }
      if (disposed) return;
      autosave.current = model;
      setPost(model.value);
      setEntry(loaded.entry);
      if (model.dirty && !model.conflicted) setStatus("local");
    })().catch((error) => {
      if (!disposed) setMessage(error.message);
    });
    return () => {
      disposed = true;
      alive.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [endpoint, id, newKind, owner]);
  const save = useCallback(async () => {
    const model = autosave.current;
    if (!model) return;
    lastGitAttempt.current = Date.now();
    await model.flush();
    if (alive.current) {
      setMessage("");
      if (newKind)
        window.history.replaceState(null, "", `/admin/writing/${id}`);
    }
  }, [id, newKind]);
  useEffect(() => {
    const interval = setInterval(() => {
      if (
        autosave.current?.dirty &&
        Date.now() - lastGitAttempt.current >= 20_000
      )
        void save().catch(() => {});
    }, 20_000);
    const online = () => void save().catch(() => {});
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save().catch(() => {});
      }
    };
    const leave = (event: BeforeUnloadEvent) => {
      if (autosave.current?.dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("online", online);
    window.addEventListener("keydown", key);
    window.addEventListener("beforeunload", leave);
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", online);
      window.removeEventListener("keydown", key);
      window.removeEventListener("beforeunload", leave);
    };
  }, [save]);
  useEffect(() => {
    document.documentElement.classList.toggle("writing-focus", focus);
    return () => document.documentElement.classList.remove("writing-focus");
  }, [focus]);
  function change(next: WritingPost) {
    if (busy) return;
    if (
      !customSlug.current &&
      !entry?.published &&
      next.title.trim() &&
      next.title !== post?.title
    )
      next = { ...next, slug: slugify(next.title) };
    setPost(next);
    autosave.current?.change(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(
      () => void save().catch(() => {}),
      Math.max(4000, 20_000 - (Date.now() - lastGitAttempt.current)),
    );
  }
  async function refresh() {
    const latest = await request(endpoint);
    setEntry(latest.entry);
    return latest;
  }
  async function publish(action: "publish" | "unpublish" | "cancel") {
    setBusy(true);
    setMessage("");
    try {
      await save();
      const model = autosave.current!;
      await request(endpoint, {
        action,
        id,
        operationId: crypto.randomUUID(),
        expectedRevision: model.baseRevision,
        expectedPublication: entry?.published?.revision ?? null,
        ...(action === "publish" && schedule
          ? { at: new Date(schedule).toISOString() }
          : {}),
        ...(action === "cancel" ? { scheduleId: entry?.schedule?.id } : {}),
      });
      await refresh();
      setPublishOpen(false);
      setSchedule("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Publication could not finish.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function compare() {
    try {
      setRemote(await request(endpoint));
    } catch (error) {
      setMessage((error as Error).message);
    }
  }
  async function showHistory() {
    try {
      if (autosave.current?.dirty) await save();
      setHistory((await request(`${endpoint}?history=1`)).revisions);
    } catch (error) {
      setMessage((error as Error).message);
    }
  }
  async function restore() {
    if (!historic) return;
    setBusy(true);
    try {
      await save();
      await request(endpoint, {
        action: "restore",
        id,
        operationId: crypto.randomUUID(),
        expectedRevision: autosave.current!.baseRevision,
        commit: historic.sha,
      });
      const latest = await refresh();
      autosave.current!.adoptRevision(latest.revision, false, latest.post);
      setPost(latest.post);
      setHistory(null);
      setHistoric(null);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function keepSeparate() {
    if (!post) return;
    const fork = {
      ...post,
      id: crypto.randomUUID(),
      slug: `${post.slug.slice(0, 140)}-copy-${crypto.randomUUID().slice(0, 8)}`,
      commentKey: "",
      sourceUrl: post.sourceUrl,
    };
    fork.commentKey = `writing:${fork.id}`;
    setBusy(true);
    try {
      await request(`/api/writing/${fork.id}`, {
        action: "save",
        id: fork.id,
        operationId: crypto.randomUUID(),
        expectedRevision: null,
        post: fork,
      });
      router.push(`/admin/writing/${fork.id}`);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!post || !owner)
    return (
      <section>
        <Link href="/admin/writing">← writing desk</Link>
        <output>{message || "opening your draft…"}</output>
        {message && (
          <button type="button" onClick={() => window.location.reload()}>
            retry
          </button>
        )}
      </section>
    );
  const statusText = {
    saved: "saved to git",
    local: "saved locally",
    recovering: "saving locally…",
    saving: "saving to git…",
    offline: "sync paused · copy kept in this tab",
    conflict: "another edit needs your attention",
    "local-error": "local recovery unavailable",
  }[status];
  return (
    <section className={`writing-studio ${details ? "with-details" : ""}`}>
      <header className="writing-studio-bar">
        <Link href="/admin/writing">← writing desk</Link>
        <output aria-live="polite">{statusText}</output>
        <div>
          <button
            type="button"
            onClick={() => void save().catch(() => {})}
            disabled={busy || status === "saving"}
          >
            save
          </button>
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            aria-pressed={preview}
          >
            {preview ? "write" : "preview"}
          </button>
          <button
            type="button"
            onClick={() => setDetails(!details)}
            aria-pressed={details}
          >
            details
          </button>
          <button type="button" onClick={() => void showHistory()}>
            history
          </button>
          <button
            type="button"
            onClick={() => setFocus(!focus)}
            aria-pressed={focus}
          >
            {focus ? "leave focus" : "focus"}
          </button>
          <button
            type="button"
            className="writing-primary"
            onClick={() => setPublishOpen(true)}
            disabled={busy || status === "conflict"}
          >
            {entry?.published ? "update" : "publish"}
          </button>
        </div>
      </header>
      {message && (
        <div className="writing-notice" role="alert">
          {message}{" "}
          <button type="button" onClick={() => download(post)}>
            download this draft
          </button>
        </div>
      )}
      {status === "conflict" && (
        <div className="writing-notice">
          <p>this draft changed elsewhere. your copy is safe.</p>
          <button type="button" onClick={() => void compare()}>
            compare with latest
          </button>
          <button
            type="button"
            onClick={() => void keepSeparate()}
            disabled={busy}
          >
            save my copy as a new draft
          </button>
        </div>
      )}
      {mediaStatus && (
        <output className="writing-notice">
          {mediaStatus}{" "}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("online"))}
          >
            retry uploads
          </button>
        </output>
      )}
      {entry?.schedule && (
        <p className="writing-notice">
          scheduled for {new Date(entry.schedule.at).toLocaleString()} · later
          edits remain drafts{" "}
          <button
            type="button"
            disabled={busy}
            onClick={() => void publish("cancel")}
          >
            cancel schedule
          </button>
        </p>
      )}
      <div className="writing-workspace">
        <div className="writing-paper">
          {preview ? (
            <WritingArticle post={post} preview />
          ) : (
            <>
              <input
                className="writing-title"
                aria-label="Post title"
                placeholder={
                  post.kind === "note" ? "title, if you want one" : "title"
                }
                value={post.title}
                maxLength={300}
                disabled={busy}
                onChange={(e) => change({ ...post, title: e.target.value })}
              />
              <WritingEditor
                body={post.body}
                owner={owner}
                postId={id}
                locked={busy}
                onChange={(body) =>
                  change({ ...autosave.current!.value, body })
                }
                onUploadStatus={setMediaStatus}
              />
            </>
          )}
        </div>
        {details && (
          <aside className="writing-settings">
            <h2>post details</h2>
            <label>
              form
              <select
                value={post.kind}
                disabled={busy}
                onChange={(e) =>
                  change({
                    ...post,
                    kind: e.target.value as WritingPost["kind"],
                  })
                }
              >
                <option value="essay">essay</option>
                <option value="note">short note</option>
              </select>
            </label>
            <label>
              address
              <input
                value={post.slug}
                disabled={busy}
                onChange={(e) => {
                  customSlug.current = true;
                  change({ ...post, slug: e.target.value });
                }}
                onBlur={(e) => {
                  if (
                    e.target.value !== post.slug ||
                    !/^[a-z0-9][a-z0-9_-]{0,159}$/.test(e.target.value)
                  )
                    change({
                      ...post,
                      slug: e.target.value.trim()
                        ? slugify(e.target.value)
                        : `${post.kind}-${id.slice(0, 8)}`,
                    });
                }}
              />
            </label>
            <label>
              summary
              <textarea
                rows={3}
                value={post.summary}
                disabled={busy}
                onChange={(e) => change({ ...post, summary: e.target.value })}
              />
            </label>
            <label>
              date <small>blank uses the first publication time</small>
              <input
                type="datetime-local"
                value={
                  post.date.length === 10
                    ? `${post.date}T12:00`
                    : post.date
                      ? new Date(
                          new Date(post.date).getTime() -
                            new Date(post.date).getTimezoneOffset() * 60_000,
                        )
                          .toISOString()
                          .slice(0, 16)
                      : ""
                }
                disabled={busy}
                onChange={(e) =>
                  change({
                    ...post,
                    date: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : "",
                  })
                }
              />
            </label>
            {(["tags", "topics"] as const).map((key) => (
              <fieldset key={key} disabled={busy}>
                <label htmlFor={`writing-${key}`}>{key}</label>
                <TagInput
                  id={`writing-${key}`}
                  tags={post[key]}
                  allTags={[]}
                  onChange={(values) => change({ ...post, [key]: values })}
                />
              </fieldset>
            ))}
            <label>
              series
              <input
                value={post.series}
                disabled={busy}
                onChange={(e) => change({ ...post, series: e.target.value })}
              />
            </label>
            <label>
              social preview image
              <input
                value={post.cover}
                placeholder="media URL or writing-asset:…"
                disabled={busy}
                onChange={(e) => change({ ...post, cover: e.target.value })}
              />
            </label>
            <button
              type="button"
              onClick={() =>
                void navigator.clipboard.writeText(
                  `Writing draft ${id}\nRepository: Tetraslam/tetraslam-writing\nFile: writing/drafts/${id}.md\nRevision: ${autosave.current?.baseRevision || "not yet saved"}\nEditor: ${location.href}`,
                )
              }
            >
              copy draft context
            </button>
            <button type="button" onClick={() => download(post)}>
              export markdown
            </button>
            {entry?.published && (
              <>
                <a
                  href={`/blog/${entry.published.meta.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  view published post ↗
                </a>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void publish("unpublish")}
                >
                  unpublish
                </button>
              </>
            )}
          </aside>
        )}
      </div>
      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>
            {entry?.published ? "Update your post" : "Publish your post"}
          </DialogTitle>
          <p>{post.title || "untitled note"}</p>
          {message && <p role="alert">{message}</p>}
          <label className="writing-dialog-field">
            publish later <small>(optional, your local time)</small>
            <input
              type="datetime-local"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              disabled={busy}
            />
          </label>
          <p>
            the selected version will be published. further edits stay private
            until you publish again.
          </p>
          <button
            type="button"
            className="writing-primary"
            disabled={busy || !!mediaStatus || hasPendingUploads(post.body)}
            onClick={() => void publish("publish")}
          >
            {busy
              ? "publishing…"
              : schedule
                ? "schedule publication"
                : entry?.published
                  ? "publish update"
                  : "publish now"}
          </button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={history !== null}
        onOpenChange={(open) => {
          if (!open) {
            setHistory(null);
            setHistoric(null);
          }
        }}
      >
        <DialogContent
          className="writing-history-dialog"
          aria-describedby={undefined}
        >
          <DialogTitle>draft history</DialogTitle>
          {message && <p role="alert">{message}</p>}
          <div className="writing-history-list">
            {history?.map((revision) => (
              <button
                key={revision.sha}
                type="button"
                onClick={() =>
                  void request(`${endpoint}?revision=${revision.sha}`)
                    .then((value) =>
                      setHistoric({ post: value.post, sha: revision.sha }),
                    )
                    .catch((error) => setMessage(error.message))
                }
              >
                {new Date(revision.date).toLocaleString()} ·{" "}
                {revision.sha.slice(0, 7)}
              </button>
            ))}
          </div>
          {historic && (
            <>
              <WritingArticle post={historic.post} preview />
              <button
                type="button"
                className="writing-primary"
                disabled={busy}
                onClick={() => void restore()}
              >
                restore as a new draft revision
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!remote}
        onOpenChange={(open) => {
          if (!open) setRemote(null);
        }}
      >
        <DialogContent
          className="writing-history-dialog"
          aria-describedby={undefined}
        >
          <DialogTitle>latest saved draft</DialogTitle>
          {remote && (
            <>
              <WritingArticle post={remote.post} preview />
              <div className="writing-actions">
                <button
                  type="button"
                  onClick={() => {
                    autosave.current!.adoptRevision(
                      remote.revision,
                      false,
                      remote.post,
                    );
                    setPost(remote.post);
                    setRemote(null);
                    setMessage("");
                  }}
                >
                  use this version
                </button>
                <button
                  type="button"
                  onClick={() => {
                    autosave.current!.adoptRevision(
                      remote.revision,
                      true,
                      remote.post,
                    );
                    setRemote(null);
                    setMessage("");
                    void save().catch(() => {});
                  }}
                >
                  replace it with my local copy
                </button>
                <button type="button" onClick={() => void keepSeparate()}>
                  keep mine as a separate draft
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
