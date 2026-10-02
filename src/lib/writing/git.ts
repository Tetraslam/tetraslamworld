import { createHash, createSign } from "node:crypto";

export class WritingError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export type GitSnapshot = { head: string; tree: string };
export interface WritingGit {
  snapshot(): Promise<GitSnapshot>;
  read(path: string, at: string): Promise<string | null>;
  commit(
    base: GitSnapshot,
    files: Record<string, string | null>,
    message: string,
  ): Promise<string>;
  history(
    path: string,
    limit?: number,
    page?: number,
  ): Promise<Array<{ sha: string; message: string; date: string }>>;
}
export function digest(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

let tokenCache: { token: string; expires: number; scope: string } | undefined;
const textCache = new Map<string, string>();
let cachedBytes = 0;
export async function writingToken() {
  // Explicit CLI-only injection uses the operator's existing gh session. The web
  // server never receives this flag/token and always uses its scoped GitHub App.
  if (process.env.WRITING_LOCAL_CLI === "1" && process.env.WRITING_GITHUB_TOKEN)
    return process.env.WRITING_GITHUB_TOKEN;
  const repo = process.env.WRITING_REPOSITORY;
  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo))
    throw new WritingError(
      "NOT_CONFIGURED",
      "The writing repository is not configured.",
      503,
    );
  const scope = `${repo}:${process.env.WRITING_GITHUB_INSTALLATION_ID}`;
  if (tokenCache?.scope === scope && tokenCache.expires > Date.now() + 60_000)
    return tokenCache.token;
  const key = process.env.WRITING_GITHUB_PRIVATE_KEY?.replaceAll("\\n", "\n");
  const app = process.env.WRITING_GITHUB_APP_ID,
    installation = process.env.WRITING_GITHUB_INSTALLATION_ID;
  if (!key || !app || !installation)
    throw new WritingError(
      "NOT_CONFIGURED",
      "GitHub App credentials are missing.",
      503,
    );
  const b64 = (v: unknown) =>
    Buffer.from(JSON.stringify(v)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const input = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iat: now - 60, exp: now + 540, iss: app })}`;
  const jwt = `${input}.${createSign("RSA-SHA256").update(input).sign(key, "base64url")}`;
  const response = await fetch(
    `https://api.github.com/app/installations/${installation}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        repositories: [repo.split("/")[1]],
        permissions: { contents: "write", metadata: "read" },
      }),
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    },
  );
  if (!response.ok)
    throw new WritingError(
      "GITHUB_AUTH",
      "Could not authenticate the writing app. Your local draft is safe.",
      503,
    );
  const data = await response.json();
  tokenCache = {
    scope,
    token: data.token,
    expires: Date.parse(data.expires_at),
  };
  return data.token as string;
}
export async function github<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${await writingToken()}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    if (response.status === 404)
      throw new WritingError(
        "NOT_FOUND",
        "The requested writing file does not exist.",
        404,
      );
    if (response.status === 409 || response.status === 422)
      throw new WritingError(
        "GIT_CONFLICT",
        "The repository changed during this save.",
        409,
      );
    throw new WritingError(
      "GITHUB_UNAVAILABLE",
      `GitHub could not complete the request (${response.status}). Your draft is retained.`,
      503,
    );
  }
  return response.status === 204 ? (undefined as T) : await response.json();
}
export class GithubWritingGit implements WritingGit {
  private get base() {
    return `/repos/${process.env.WRITING_REPOSITORY}`;
  }
  private get branch() {
    return process.env.WRITING_BRANCH || "main";
  }
  async snapshot() {
    const ref = await github<{ object: { sha: string } }>(
      `${this.base}/git/ref/heads/${encodeURIComponent(this.branch)}`,
    );
    const commit = await github<{ tree: { sha: string } }>(
      `${this.base}/git/commits/${ref.object.sha}`,
    );
    return { head: ref.object.sha, tree: commit.tree.sha };
  }
  async read(path: string, at: string) {
    if (!/^[\w./-]+$/.test(path) || path.includes(".."))
      throw new WritingError("INVALID_PATH", "Invalid writing path.");
    const cacheKey = `${this.base}:${at}:${path}`;
    const cached = textCache.get(cacheKey);
    if (cached !== undefined) return cached;
    try {
      const data = await github<{
        type: string;
        content?: string;
        encoding: string;
        sha: string;
        size: number;
      }>(`${this.base}/contents/${path}?ref=${encodeURIComponent(at)}`);
      if (data.type !== "file" || data.size > 20_000_000)
        throw new WritingError(
          "INVALID_FILE",
          "Writing files must be UTF-8 text smaller than 20 MB.",
        );
      const blob =
        data.encoding === "base64"
          ? data
          : await github<{ content: string; encoding: string }>(
              `${this.base}/git/blobs/${data.sha}`,
            );
      if (blob.encoding !== "base64" || blob.content === undefined)
        throw new WritingError(
          "INVALID_FILE",
          "Writing file could not be decoded.",
        );
      const value = Buffer.from(blob.content, "base64").toString("utf8");
      textCache.set(cacheKey, value);
      cachedBytes += Buffer.byteLength(value);
      while (cachedBytes > 12_000_000 && textCache.size) {
        const key = textCache.keys().next().value!;
        cachedBytes -= Buffer.byteLength(textCache.get(key)!);
        textCache.delete(key);
      }
      return value;
    } catch (error) {
      if (error instanceof WritingError && error.code === "NOT_FOUND")
        return null;
      throw error;
    }
  }
  async commit(
    base: GitSnapshot,
    files: Record<string, string | null>,
    message: string,
  ) {
    const tree = await github<{ sha: string }>(`${this.base}/git/trees`, {
      method: "POST",
      body: JSON.stringify({
        base_tree: base.tree,
        tree: Object.entries(files).map(([path, content]) => ({
          path,
          mode: "100644",
          type: "blob",
          ...(content === null ? { sha: null } : { content }),
        })),
      }),
    });
    const commit = await github<{ sha: string }>(`${this.base}/git/commits`, {
      method: "POST",
      body: JSON.stringify({ message, tree: tree.sha, parents: [base.head] }),
    });
    await github(
      `${this.base}/git/refs/heads/${encodeURIComponent(this.branch)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ sha: commit.sha, force: false }),
      },
    );
    return commit.sha;
  }
  async history(path: string, limit = 30, page=1) {
    const rows = await github<
      Array<{
        sha: string;
        commit: { message: string; committer: { date: string } };
      }>
    >(
      `${this.base}/commits?sha=${encodeURIComponent(this.branch)}&path=${encodeURIComponent(path)}&per_page=${Math.min(limit, 100)}&page=${page}`,
    );
    return rows.map((row) => ({
      sha: row.sha,
      message: row.commit.message,
      date: row.commit.committer.date,
    }));
  }
}
