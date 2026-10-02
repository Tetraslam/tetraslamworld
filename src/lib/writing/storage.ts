import { createHash, randomUUID } from "node:crypto";
import { Readable, Transform } from "node:stream";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { WRITING_LIMITS, type WritingAsset } from "../../../shared/writing";
import { github, WritingError, writingToken } from "./git";
import type { WritingService } from "./service";

export const uploadSchema = z
  .object({
    filename: z.string().min(1).max(255),
    contentType: z.string().regex(/^(image|video|audio)\/[\w.+-]+$/),
    size: z.number().int().positive().max(WRITING_LIMITS.uploadBytes),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
export type UploadIntent = z.infer<typeof uploadSchema>;
function storage() {
  const accessKeyId = process.env.WRITING_S3_ACCESS_KEY_ID,
    secretAccessKey = process.env.WRITING_S3_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey || !process.env.WRITING_S3_BUCKET)
    throw new WritingError(
      "NOT_CONFIGURED",
      "Media storage is not configured.",
      503,
    );
  return new S3Client({
    region: "auto",
    endpoint: process.env.WRITING_S3_ENDPOINT || "https://t3.storage.dev",
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}
const bucket = () => process.env.WRITING_S3_BUCKET!;
export async function prepareUpload(input: UploadIntent) {
  const intent = uploadSchema.parse(input),
    uploadId = randomUUID();
  const url = await getSignedUrl(
    storage(),
    new PutObjectCommand({
      Bucket: bucket(),
      Key: `uploads/${uploadId}`,
      ContentType: intent.contentType,
      ContentLength: intent.size,
    }),
    { expiresIn: 900 },
  );
  return { ...intent, uploadId, url };
}
type BackupAsset = {
  id: number;
  name: string;
  digest: string | null;
  size: number;
};
async function backupRelease() {
  const path = `/repos/${process.env.WRITING_REPOSITORY}`;
  try {
    return await github<{ id: number }>(
      `${path}/releases/tags/writing-originals`,
    );
  } catch (error) {
    if (!(error instanceof WritingError) || error.code !== "NOT_FOUND")
      throw error;
  }
  try {
    return await github<{ id: number }>(`${path}/releases`, {
      method: "POST",
      body: JSON.stringify({
        tag_name: "writing-originals",
        name: "Original media backup",
        body: "Independent original-byte backups for the private writing repository.",
        draft: false,
        prerelease: true,
      }),
    });
  } catch (error) {
    if (error instanceof WritingError && error.code === "GIT_CONFLICT")
      return github<{ id: number }>(`${path}/releases/tags/writing-originals`);
    throw error;
  }
}
async function findBackup(releaseId: number, name: string) {
  for (let page = 1; page <= 100; page++) {
    const rows = await github<BackupAsset[]>(
      `/repos/${process.env.WRITING_REPOSITORY}/releases/${releaseId}/assets?per_page=100&page=${page}`,
    );
    const match = rows.find((asset) => asset.name === name);
    if (match) return match;
    if (rows.length < 100) return null;
  }
  throw new WritingError(
    "BACKUP_LIMIT",
    "The backup release needs archiving before adding more media.",
    503,
  );
}
async function backupOriginal(key: string, input: UploadIntent) {
  const release = await backupRelease(),
    name = `${input.sha256}.original`;
  let asset = await findBackup(release.id, name);
  if (!asset) {
    const original = await storage().send(
      new GetObjectCommand({ Bucket: bucket(), Key: key }),
    );
    if (!original.Body)
      throw new WritingError(
        "MEDIA_MISSING",
        "Original media is unavailable.",
        503,
      );
    const init: RequestInit & { duplex: "half" } = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await writingToken()}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/octet-stream",
        "Content-Length": String(input.size),
      },
      body: original.Body.transformToWebStream(),
      duplex: "half",
      signal: AbortSignal.timeout(240_000),
    };
    const response = await fetch(
      `https://uploads.github.com/repos/${process.env.WRITING_REPOSITORY}/releases/${release.id}/assets?name=${name}`,
      init,
    );
    if (response.ok) asset = await response.json();
    else if (response.status === 422)
      asset = await findBackup(release.id, name);
    else
      throw new WritingError(
        "BACKUP_FAILED",
        "The original uploaded, but its independent backup is still pending. Retry to finish safely.",
        503,
      );
  }
  if (
    !asset ||
    asset.size !== input.size ||
    asset.digest !== `sha256:${input.sha256}`
  )
    throw new WritingError(
      "BACKUP_MISMATCH",
      "The backup checksum did not match. This media cannot be published yet.",
      503,
    );
  return { releaseId: release.id, assetId: asset.id, digest: asset.digest };
}
export async function completeUpload(
  service: WritingService,
  input: UploadIntent & { uploadId: string },
): Promise<WritingAsset> {
  const { uploadId, ...rest } = input;
  z.string().uuid().parse(uploadId);
  const intent = uploadSchema.parse(rest);
  const existing = (await service.load()).index.assets[intent.sha256];
  if (existing) return existing;
  const client = storage(),
    source = await client.send(
      new GetObjectCommand({ Bucket: bucket(), Key: `uploads/${uploadId}` }),
    );
  if (
    !source.Body ||
    source.ContentLength !== intent.size ||
    source.ContentLength > WRITING_LIMITS.uploadBytes
  )
    throw new WritingError(
      "INVALID_UPLOAD",
      "The uploaded file is missing or has the wrong size.",
    );
  // The browser can rewrite its staging key. Stream one coherent S3 response
  // into a fresh server-owned key; never copy a mutable staging name after hashing.
  const key = `originals/${randomUUID()}`,
    hash = createHash("sha256");
  let size = 0;
  const verified = new Transform({
    transform(chunk, _encoding, done) {
      size += chunk.length;
      if (size > intent.size) {
        done(new Error("Upload exceeded its declared size."));
        return;
      }
      hash.update(chunk);
      done(null, chunk);
    },
  });
  const body = source.Body as Readable;
  body.on("error", (error) => verified.destroy(error));
  body.pipe(verified);
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket(),
        Key: key,
        Body: verified,
        ContentLength: intent.size,
        ContentType: intent.contentType,
        Metadata: { sha256: intent.sha256 },
      }),
    );
    if (size !== intent.size || hash.digest("hex") !== intent.sha256)
      throw new WritingError(
        "CHECKSUM_MISMATCH",
        "The uploaded bytes differ from the selected file. Please upload it again.",
      );
  } catch (error) {
    body.destroy();
    verified.destroy();
    await client
      .send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }))
      .catch(() => {});
    throw error;
  }
  const backup = await backupOriginal(key, intent);
  const asset: WritingAsset = {
    id: intent.sha256,
    sha256: intent.sha256,
    key,
    filename: intent.filename,
    contentType: intent.contentType,
    size: intent.size,
    backup,
    createdAt: new Date().toISOString(),
  };
  const registered = await service.registerAsset(asset);
  if (registered.key !== key)
    await client
      .send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }))
      .catch(() => {});
  await client
    .send(
      new DeleteObjectCommand({ Bucket: bucket(), Key: `uploads/${uploadId}` }),
    )
    .catch(() => {});
  return registered;
}
export async function originalUrl(asset: WritingAsset) {
  return getSignedUrl(
    storage(),
    new GetObjectCommand({
      Bucket: bucket(),
      Key: asset.key,
      ResponseContentType: asset.contentType,
      ResponseContentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(asset.filename)}`,
    }),
    { expiresIn: 300 },
  );
}
export async function readOriginal(asset: WritingAsset) {
  return storage().send(
    new GetObjectCommand({ Bucket: bucket(), Key: asset.key }),
  );
}
export async function inspectOriginal(asset: WritingAsset) {
  return storage().send(
    new HeadObjectCommand({ Bucket: bucket(), Key: asset.key }),
  );
}
export async function fetchBackupOriginal(asset:WritingAsset){
  const response=await fetch(`https://api.github.com/repos/${process.env.WRITING_REPOSITORY}/releases/assets/${asset.backup.assetId}`,{headers:{Authorization:`Bearer ${await writingToken()}`,Accept:"application/octet-stream"},signal:AbortSignal.timeout(240_000)});
  if(!response.ok||!response.body)throw new WritingError("BACKUP_UNAVAILABLE","The independent original backup could not be read.",503);
  const size=response.headers.get("content-length");if(size&&Number(size)!==asset.size){await response.body.cancel();throw new WritingError("BACKUP_MISMATCH","The backup size does not match the manifest.",503);}
  return response;
}

export async function backupWritingSnapshot(service: WritingService) {
  const prefix =
    !process.env.WRITING_BRANCH || process.env.WRITING_BRANCH === "main"
      ? "git-snapshots"
      : `verification-snapshots/${encodeURIComponent(process.env.WRITING_BRANCH)}`;
  const { snapshot } = await service.load(),
    client = storage(),
    key = `${prefix}/${snapshot.head}.zip`;
  let exists=false;
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    exists=true;
  } catch (error) {
    if (
      (error as { $metadata?: { httpStatusCode: number } }).$metadata
        ?.httpStatusCode !== 404
    )
      throw error;
  }
  if(!exists){
  const response = await fetch(
    `https://api.github.com/repos/${process.env.WRITING_REPOSITORY}/zipball/${snapshot.head}`,
    {
      headers: {
        Authorization: `Bearer ${await writingToken()}`,
        Accept: "application/vnd.github+json",
      },
      signal: AbortSignal.timeout(120_000),
    },
  );
  if (!response.ok || !response.body)
    throw new WritingError(
      "BACKUP_FAILED",
      "The independent writing snapshot could not be fetched.",
      503,
    );
  await new Upload({
    client,
    queueSize: 2,
    partSize: 5 * 1024 * 1024,
    params: {
      Bucket: bucket(),
      Key: key,
      Body: Readable.fromWeb(
        response.body as import("node:stream/web").ReadableStream,
      ),
      ContentType: "application/zip",
      Metadata: { "git-head": snapshot.head },
    },
  }).done();
  }
  let etag:string|undefined;
  try{etag=(await client.send(new HeadObjectCommand({Bucket:bucket(),Key:`${prefix}/latest.json`}))).ETag;}catch(error){if((error as {$metadata?:{httpStatusCode:number}}).$metadata?.httpStatusCode!==404)throw error;}
  if((await service.git.snapshot()).head!==snapshot.head)return {head:snapshot.head,backedUp:true,superseded:true};
  try{await client.send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: `${prefix}/latest.json`,
      Body: JSON.stringify({
        head: snapshot.head,
        key,
        createdAt: new Date().toISOString(),
      }),
      ContentType: "application/json",
      ...(etag?{IfMatch:etag}:{IfNoneMatch:"*"}),
    }),
  );}catch(error){if((error as {$metadata?:{httpStatusCode:number}}).$metadata?.httpStatusCode!==412)throw error;}
  return { head: snapshot.head, backedUp: true };
}
