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
import {
  beginRecoverySession,
  clearRecoveredCopy,
  getRecovery,
  getRecoveryCopies,
  putRecovery,
  type Recovery,
} from "@/lib/writing/local";
import { slugify } from "../../../shared/taste";
import {
  defaultPost,
  hasPendingUploads,
  type PublicationEvent,
  serializePost,
  type WritingEntry,
  type WritingPost,
} from "../../../shared/writing";
import { TagInput } from "../tag-input";
import { AssetPicker } from "./asset-picker";
import { WritingEditor } from "./editor";
import { WritingArticle } from "./prose";

async function request(url: string, body?: unknown) {
  const options: RequestInit = body
    ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    : { cache: "no-store" };
  let response: Response | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      response = await fetch(url, options);
    } catch (error) {
      if (!body || attempt) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500));
      continue;
    }
    if (body && response.status >= 500 && !attempt) {
      await response.body?.cancel();
      await new Promise((resolve) => setTimeout(resolve, 500));
      continue;
    }
    break;
  }
  if (!response)
    throw new SaveFailure("UNAVAILABLE", "Couldn’t reach the writing service.");
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
  try {
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
  } catch {
    return "";
  }
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
    [contextCopied, setContextCopied] = useState(false),
    [sourceMode, setSourceMode] = useState(false),
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
      publication?: boolean;
      local?: Recovery;
    } | null>(null),
    [remote, setRemote] = useState<{
      post: WritingPost;
      revision: string;
    } | null>(null);
  const autosave = useRef<DraftAutosave | null>(null),
    alive = useRef(true),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const customSlug = useRef(!newKind);
  const [publicationHistory, setPublicationHistory] = useState<
      PublicationEvent[]
    >([]),
    [historyMode, setHistoryMode] = useState<
      "drafts" | "publications" | "device"
    >("drafts"),
    [historyPage, setHistoryPage] = useState(1),
    [moreHistory, setMoreHistory] = useState(false),
    [localCopies, setLocalCopies] = useState<Recovery[]>([]);
  const lastGitAttempt = useRef(0);
  const needsMetadata = useRef(false);
  const recoverySession = useRef<string | undefined>(undefined);
  const endpoint = `/api/writing/${id}`;
  useEffect(() => {
    alive.current = true;
    if (!owner) return;
    let disposed = false;
    let lease: Awaited<ReturnType<typeof beginRecoverySession>> | undefined;
    void (async () => {
      lease = await beginRecoverySession(owner, id);
      recoverySession.current = lease.id;
      if (disposed) {
        lease.release();
        return;
      }
      let recovery = await getRecovery(owner, id).catch(() => undefined),
        offline = false;
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
        else if (recovery) {
          loaded = { post: recovery.post, revision: recovery.baseRevision };
          offline = true;
        } else throw error;
      }
      if (
        !offline &&
        recovery &&
        !recovery.pending &&
        (recovery.dirty === false ||
          (await sourceHash(recovery.post)) === recovery.baseRevision)
      )
        recovery = undefined;
      const model = new DraftAutosave(
        loaded.post,
        loaded.revision,
        {
          send: (input) => request(endpoint, input),
          persist: async (state) => {
            await putRecovery(owner, state, lease?.id);
            if (!state.dirty && recovery)
              await clearRecoveredCopy(owner, recovery);
          },
          status: (state, detail) => {
            if (alive.current && !disposed) {
              setStatus(state);
              if (detail) setMessage(detail);
            }
          },
        },
        recovery,
      );
      if (!offline && recovery && recovery.baseRevision !== loaded.revision) {
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
      if (loaded.revision === null) model.change(model.value);
      needsMetadata.current = !loaded.entry;
      if (offline) model.recoverOffline();
      setPost(model.value);
      setEntry(loaded.entry);
      if (
        !offline &&
        loaded.revision !== null &&
        model.dirty &&
        !model.conflicted
      )
        setStatus("local");
    })().catch((error) => {
      if (!disposed) setMessage(error.message);
    });
    return () => {
      disposed = true;
      alive.current = false;
      lease?.release();
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
      if (needsMetadata.current) {
        try {
          const latest = await request(`/api/writing/${id}`);
          if (alive.current) {
            setEntry(latest.entry);
            needsMetadata.current = false;
          }
        } catch {}
      }
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
  const scheduledId = entry?.schedule?.id,
    scheduledAt = entry?.schedule?.at;
  useEffect(() => {
    if (!scheduledId || !scheduledAt) return;
    let stopped = false;
    let check: ReturnType<typeof setTimeout>;
    const refresh = async () => {
      try {
        const latest = await request(endpoint);
        if (stopped) return;
        setEntry(latest.entry);
        if (latest.entry?.schedule?.id === scheduledId)
          check = setTimeout(
            refresh,
            Math.min(
              86_400_000,
              Math.max(
                15_000,
                Date.parse(latest.entry.schedule.at) - Date.now() + 2000,
              ),
            ),
          );
      } catch {
        if (!stopped) check = setTimeout(refresh, 30_000);
      }
    };
    check = setTimeout(
      refresh,
      Math.min(
        86_400_000,
        Math.max(1000, Date.parse(scheduledAt) - Date.now() + 2000),
      ),
    );
    return () => {
      stopped = true;
      clearTimeout(check);
    };
  }, [endpoint, scheduledId, scheduledAt]);
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
      // A response can disappear after Git committed. Refresh the visible state
      // without issuing another publication under a new operation ID.
      await refresh().catch(() => {});
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
    setHistoric(null);
    setLocalCopies(await getRecoveryCopies(owner!, id).catch(() => []));
    setHistory([]);
    try {
      const [drafts, publications] = await Promise.all([
        request(`${endpoint}?history=1`),
        request(`${endpoint}?publications=1`),
      ]);
      setHistory(drafts.revisions);
      setMoreHistory(drafts.revisions.length === 30);
      setHistoryPage(1);
      setPublicationHistory(publications.events);
      setHistoryMode("drafts");
      setHistoric(null);
    } catch (error) {
      setHistoryMode("device");
      setMessage((error as Error).message);
    }
  }
  async function restore() {
    if (!historic) return;
    setBusy(true);
    try {
      await save();
      await request(endpoint, {
        action: historic.local
          ? "save"
          : historic.publication
            ? "restorePublication"
            : "restore",
        id,
        operationId: crypto.randomUUID(),
        expectedRevision: autosave.current!.baseRevision,
        commit: historic.sha,
        revision: historic.sha,
        ...(historic.local ? { post: historic.post } : {}),
      });
      const latest = await refresh();
      autosave.current!.adoptRevision(latest.revision, false, latest.post);
      setPost(latest.post);
      setHistory(null);
      setHistoric(null);
      if (historic.local) await clearRecoveredCopy(owner!, historic.local);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function keepSeparate() {
    if (!post) return;
    if (hasPendingUploads(post.body)) {
      setMessage(
        "Let the remaining media uploads finish before making a separate copy.",
      );
      return;
    }
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
      await autosave.current?.persistLocal();
      const oldCopy = (
        await getRecoveryCopies(owner!, id).catch(() => [])
      ).find((copy) => copy.session === recoverySession.current);
      await request(`/api/writing/${fork.id}`, {
        action: "save",
        id: fork.id,
        operationId: crypto.randomUUID(),
        expectedRevision: null,
        post: fork,
      });
      if (oldCopy) await clearRecoveredCopy(owner!, oldCopy);
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
          {preview && <WritingArticle post={post} preview />}
          <div hidden={preview}>
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
            {sourceMode && (
              <textarea
                className="writing-source"
                aria-label="Markdown source"
                value={post.body}
                disabled={busy}
                onChange={(event) =>
                  change({ ...post, body: event.target.value })
                }
              />
            )}
            <div hidden={sourceMode}>
              <WritingEditor
                body={post.body}
                owner={owner}
                postId={id}
                locked={busy || preview || sourceMode}
                onChange={(body) =>
                  change({ ...autosave.current!.value, body })
                }
                onUploadStatus={setMediaStatus}
                autoFocus={!!newKind}
              />
            </div>
          </div>
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
            <p>social preview image</p>
            <AssetPicker
              value={post.cover}
              disabled={busy}
              onChange={(cover) => change({ ...post, cover })}
            />
            <button
              type="button"
              onClick={async () => {
                try {
                  await save();
                  await navigator.clipboard.writeText(
                    `Writing draft ${id}\nRepository: Tetraslam/tetraslam-writing\nFile: writing/drafts/${id}.md\nRevision: ${autosave.current?.baseRevision || "not yet saved"}\nEditor: ${location.href}`,
                  );
                  setContextCopied(true);
                  setTimeout(() => setContextCopied(false), 2000);
                } catch (error) {
                  setMessage(
                    error instanceof Error
                      ? error.message
                      : "Couldn’t copy draft context.",
                  );
                }
              }}
            >
              {contextCopied ? "context copied" : "copy draft context"}
            </button>
            <button type="button" onClick={() => download(post)}>
              export markdown
            </button>
            <button
              type="button"
              onClick={() => {
                setSourceMode(!sourceMode);
                setPreview(false);
              }}
            >
              {sourceMode ? "use visual editor" : "edit markdown source"}
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
          <DialogTitle>version history</DialogTitle>
          <div className="writing-actions">
            <button
              type="button"
              aria-pressed={historyMode === "drafts"}
              onClick={() => {
                setHistoryMode("drafts");
                setHistoric(null);
              }}
            >
              draft checkpoints
            </button>
            <button
              type="button"
              aria-pressed={historyMode === "publications"}
              onClick={() => {
                setHistoryMode("publications");
                setHistoric(null);
              }}
            >
              publications
            </button>
            <button
              type="button"
              aria-pressed={historyMode === "device"}
              onClick={() => {
                setHistoryMode("device");
                setHistoric(null);
              }}
            >
              on this device
            </button>
          </div>
          {message && <p role="alert">{message}</p>}
          <div className="writing-history-list">
            {historyMode === "drafts" &&
              history?.map((revision) => (
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
            {historyMode === "publications" &&
              publicationHistory.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  disabled={!event.revision}
                  onClick={() =>
                    void request(`${endpoint}?publication=${event.revision}`)
                      .then((value) =>
                        setHistoric({
                          post: value.post,
                          sha: event.revision!,
                          publication: true,
                        }),
                      )
                      .catch((error) => setMessage(error.message))
                  }
                >
                  {event.action} · {new Date(event.at).toLocaleString()}
                  {event.scheduledFor
                    ? ` → ${new Date(event.scheduledFor).toLocaleString()}`
                    : ""}
                </button>
              ))}
            {historyMode === "device" &&
              localCopies.map((copy) => (
                <button
                  key={copy.session || "legacy"}
                  type="button"
                  onClick={() =>
                    setHistoric({ post: copy.post, sha: "", local: copy })
                  }
                >
                  {new Date(copy.savedAt).toLocaleString()} ·{" "}
                  {copy.dirty ? "local changes" : "saved checkpoint"}
                </button>
              ))}
          </div>
          {historyMode === "drafts" && moreHistory && (
            <button
              type="button"
              onClick={() =>
                void request(`${endpoint}?history=1&page=${historyPage + 1}`)
                  .then((value) => {
                    setHistory((previous) => [
                      ...(previous || []),
                      ...value.revisions,
                    ]);
                    setHistoryPage(historyPage + 1);
                    setMoreHistory(value.revisions.length === 30);
                  })
                  .catch((error) => setMessage(error.message))
              }
            >
              older checkpoints
            </button>
          )}
          {historyMode === "publications" && !publicationHistory.length && (
            <p>this draft has not been published.</p>
          )}
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
