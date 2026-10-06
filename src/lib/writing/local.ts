import type { WritingAsset, WritingPost } from "../../../shared/writing";
export type SaveRequest = {
  action: "save";
  id: string;
  operationId: string;
  expectedRevision: string | null;
  post: WritingPost;
};
export type Recovery = {
  post: WritingPost;
  baseRevision: string | null;
  pending?: SaveRequest;
  savedAt: number;
  dirty?: boolean;
  session?: string;
};
export type UploadRecord = {
  id: string;
  owner: string;
  postId: string;
  name: string;
  file: Blob;
  createdAt: number;
  phase: "pending" | "uploaded" | "done";
  attached?: boolean;
  intent?: {
    uploadId: string;
    url: string;
    filename: string;
    contentType: string;
    sha256: string;
    size: number;
  };
  asset?: WritingAsset;
  poster?: WritingAsset;
  width?: number;
  height?: number;
};
let database: Promise<IDBDatabase> | undefined;
function open() {
  if (!database)
    database = new Promise((resolve, reject) => {
      const request = indexedDB.open("tetraslam-writing", 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("drafts");
        request.result.createObjectStore("uploads");
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          database = undefined;
        };
        resolve(db);
      };
      request.onerror = () => {
        database = undefined;
        reject(request.error);
      };
      request.onblocked = () =>
        reject(new Error("Local recovery storage is blocked by another tab."));
    });
  return database;
}
async function transaction<T>(
  store: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode, { durability: "strict" }),
      request = action(tx.objectStore(store));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () =>
      reject(tx.error || new Error("Local save was interrupted."));
  });
}
const leaseName = (owner: string, id: string, session: string) =>
  `writing:${owner}/${id}/${session}`;
export async function beginRecoverySession(
  owner: string,
  id: string,
): Promise<{ id: string; release: () => void }> {
  const session = crypto.randomUUID();
  if (!navigator.locks) return { id: session, release: () => {} };
  return new Promise((resolve) => {
    let release = () => {};
    const held = new Promise<void>((done) => {
      release = done;
    });
    void navigator.locks
      .request(leaseName(owner, id, session), async () => {
        resolve({ id: session, release });
        await held;
      })
      .catch(() => resolve({ id: session, release: () => {} }));
  });
}
export async function getRecoveryCopies(
  owner: string,
  id: string,
): Promise<Recovery[]> {
  const prefix = `${owner}/${id}/`;
  const [copies, legacy] = await Promise.all([
    transaction<Recovery[]>("drafts", "readonly", (store) =>
      store.getAll(IDBKeyRange.bound(prefix, `${prefix}\uffff`)),
    ),
    transaction<Recovery | undefined>("drafts", "readonly", (store) =>
      store.get(`${owner}/${id}`),
    ),
  ]);
  return [...copies, ...(legacy ? [legacy] : [])].sort(
    (a, b) => b.savedAt - a.savedAt,
  );
}
export async function getRecovery(owner: string, id: string) {
  const held = new Set(
    (await navigator.locks?.query().catch(() => undefined))?.held?.map(
      (lock) => lock.name,
    ) || [],
  );
  return (await getRecoveryCopies(owner, id)).find(
    (copy) => !copy.session || !held.has(leaseName(owner, id, copy.session)),
  );
}
export const putRecovery = (owner: string, state: Recovery, session?: string) =>
  transaction("drafts", "readwrite", (s) =>
    s.put(
      { ...state, ...(session ? { session } : {}) },
      `${owner}/${state.post.id}${session ? `/${session}` : ""}`,
    ),
  );
export const removeRecovery = (owner: string, id: string) =>
  transaction("drafts", "readwrite", (s) => s.delete(`${owner}/${id}`));
export async function clearRecoveredCopy(owner: string, copy: Recovery) {
  const db = await open(),
    key = `${owner}/${copy.post.id}${copy.session ? `/${copy.session}` : ""}`;
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("drafts", "readwrite", { durability: "strict" }),
      store = tx.objectStore("drafts"),
      read = store.get(key);
    read.onsuccess = () => {
      if (JSON.stringify(read.result) === JSON.stringify(copy))
        store.delete(key);
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
export const saveUpload = (upload: UploadRecord) =>
  transaction("uploads", "readwrite", (s) =>
    s.put(upload, `${upload.owner}/${upload.id}`),
  );
export const getUploads = async (owner: string, postId: string) =>
  (
    await transaction<UploadRecord[]>("uploads", "readonly", (s) => s.getAll())
  ).filter((item) => item.owner === owner && item.postId === postId);
export const deleteUpload = (owner: string, id: string) =>
  transaction("uploads", "readwrite", (s) => s.delete(`${owner}/${id}`));
