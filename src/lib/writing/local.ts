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
};
export type UploadRecord = {
  id: string;
  owner: string;
  postId: string;
  name: string;
  file: Blob;
  createdAt: number;
  phase: "pending" | "uploaded" | "done";
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
    const tx = db.transaction(store, mode,{durability:"strict"}),
      request = action(tx.objectStore(store));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () =>
      reject(tx.error || new Error("Local save was interrupted."));
  });
}
export const getRecovery = (owner: string, id: string) =>
  transaction<Recovery | undefined>("drafts", "readonly", (s) =>
    s.get(`${owner}/${id}`),
  );
export const putRecovery = (owner: string, state: Recovery) =>
  transaction("drafts", "readwrite", (s) =>
    s.put(state, `${owner}/${state.post.id}`),
  );
export const removeRecovery = (owner: string, id: string) =>
  transaction("drafts", "readwrite", (s) => s.delete(`${owner}/${id}`));
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
