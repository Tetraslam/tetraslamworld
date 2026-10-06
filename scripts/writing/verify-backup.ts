import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { digest, GithubWritingGit } from "../../src/lib/writing/git";
import { WritingService } from "../../src/lib/writing/service";
import {
  backupWritingSnapshot,
  fetchBackupOriginal,
} from "../../src/lib/writing/storage";

async function main() {
  const service = new WritingService(new GithubWritingGit());
  process.env.WRITING_BRANCH = "main";
  const original = await service.load();
  process.env.WRITING_BRANCH = "verification/writing-foundation";
  const fixture = await service.load();
  const bytes = await readFile("public/favicon.svg"),
    id = digest(bytes),
    asset = fixture.index.assets[id];
  assert(asset);
  assert.equal(
    original.index.assets[id],
    undefined,
    "Never delete a real collection asset for verification.",
  );
  assert.equal(asset.filename, "favicon.svg");
  const client = new S3Client({
    region: "auto",
    endpoint: process.env.WRITING_S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.WRITING_S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.WRITING_S3_SECRET_ACCESS_KEY!,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
  });
  const Bucket = process.env.WRITING_S3_BUCKET!,
    Key = asset.key;
  try {
    await client.send(new DeleteObjectCommand({ Bucket, Key }));
    await assert.rejects(
      client.send(new HeadObjectCommand({ Bucket, Key })),
      (error) =>
        (error as { $metadata?: { httpStatusCode: number } }).$metadata
          ?.httpStatusCode === 404,
    );
    const restored = new Uint8Array(
      await (await fetchBackupOriginal(asset)).arrayBuffer(),
    );
    assert.equal(digest(restored), id);
    assert.equal(restored.length, bytes.length);
    const snapshot = await backupWritingSnapshot(service);
    assert(snapshot.backedUp);
    console.log(
      JSON.stringify({
        verified: true,
        primaryMissing: true,
        independentBackupMatched: true,
        privateSnapshotBackedUp: true,
        productionMutated: false,
      }),
    );
  } finally {
    await client.send(
      new PutObjectCommand({
        Bucket,
        Key,
        Body: bytes,
        ContentType: asset.contentType,
        Metadata: { sha256: id },
      }),
    );
  }
}
void main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Backup verification failed",
  );
  process.exitCode = 1;
});
