import type { WritingPost } from "../../../shared/writing";
import type { Recovery, SaveRequest } from "./local";
export class SaveFailure extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export type SaveStatus =
  | "saved"
  | "local"
  | "recovering"
  | "saving"
  | "offline"
  | "conflict"
  | "local-error";
type Result = { revision: string; currentRevision: string; replayed: boolean };
export class DraftAutosave {
  private post: WritingPost;
  private revision: string | null;
  private committed: string;
  private pending?: SaveRequest;
  private running: Promise<void> | undefined;
  private writes = Promise.resolve();
  private held = false;
  constructor(
    post: WritingPost,
    revision: string | null,
    private io: {
      send: (request: SaveRequest) => Promise<Result>;
      persist: (state: Recovery) => Promise<unknown>;
      status: (status: SaveStatus, message?: string) => void;
    },
    recovery?: Recovery,
  ) {
    this.post = recovery?.post ?? post;
    this.revision = recovery ? recovery.baseRevision : revision;
    this.pending = recovery?.pending;
    this.committed = JSON.stringify(post);
  }
  get value() {
    return this.post;
  }
  get baseRevision() {
    return this.revision;
  }
  get conflicted() {
    return this.held;
  }
  get dirty() {
    return !!this.pending || JSON.stringify(this.post) !== this.committed;
  }
  change(post: WritingPost) {
    this.post = post;
    this.io.status(this.held ? "conflict" : "recovering");
    void this.checkpoint();
  }
  private checkpoint() {
    const state: Recovery = {
      post: structuredClone(this.post),
      baseRevision: this.revision,
      pending: this.pending ? structuredClone(this.pending) : undefined,
      savedAt: Date.now(),
    };
    this.writes = this.writes
      .catch(() => {})
      .then(async () => {
        try {
          await this.io.persist(state);
          if(!this.held&&this.dirty&&JSON.stringify(state.post)===JSON.stringify(this.post))this.io.status("local");
        } catch {
          this.io.status(
            "local-error",
            "Local recovery is unavailable. Keep this tab open until the Git save finishes.",
          );
        }
      });
    return this.writes;
  }
  hold() {
    this.held = true;
    this.io.status("conflict");
  }
  adoptRevision(revision: string, keepMine: boolean, remote: WritingPost) {
    this.revision = revision;
    this.committed = JSON.stringify(remote);
    this.pending = undefined;
    this.held = false;
    if (!keepMine) this.post = remote;
    void this.checkpoint();
    this.io.status(this.dirty ? "local" : "saved");
  }
  async flush(): Promise<void> {
    if (this.held)
      throw new SaveFailure(
        "CONFLICT",
        "Resolve the other edit before saving.",
      );
    if (this.running) {
      await this.running;
      if (this.dirty) return this.flush();
      return;
    }
    if (!this.dirty) return;
    this.running = this.save();
    try {
      await this.running;
    } finally {
      this.running = undefined;
    }
  }
  private async save() {
    this.pending ??= {
      action: "save",
      id: this.post.id,
      operationId: crypto.randomUUID(),
      expectedRevision: this.revision,
      post: structuredClone(this.post),
    };
    await this.checkpoint();
    this.io.status("saving");
    try {
      const request = this.pending,
        result = await this.io.send(request);
      if (result.currentRevision !== result.revision) {
        this.held = true;
        this.io.status("conflict");
        throw new SaveFailure(
          "CONFLICT",
          "Your earlier save succeeded, but another session has since edited this draft.",
        );
      }
      this.revision = result.revision;
      this.committed = JSON.stringify(request.post);
      this.pending = undefined;
      await this.checkpoint();
      this.io.status(this.dirty ? "local" : "saved");
    } catch (error) {
      if (error instanceof SaveFailure && error.code === "CONFLICT") {
        this.held = true;
        this.io.status("conflict", error.message);
      } else {
        if (
          error instanceof SaveFailure &&
          ["INVALID_INPUT", "INVALID_ID", "TOO_LARGE"].includes(error.code)
        ) {
          this.pending = undefined;
          await this.checkpoint();
        }
        this.io.status(
          "offline",
          error instanceof Error
            ? error.message
            : "Couldn’t sync. Your changes are still in this tab.",
        );
      }
      throw error;
    }
  }
}
