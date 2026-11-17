/**
 * Minimal reader for the uncompressed tar archives GitHub serves from
 * codeload. Returns regular files under the archive's top directory, plus the
 * commit recorded in the global pax header and the newest file mtime.
 */
export type TarFiles = {
  files: Record<string, Uint8Array>;
  commit?: string;
  mtime: number;
};

const decoder = new TextDecoder();

function text(block: Uint8Array, start: number, length: number) {
  const slice = block.subarray(start, start + length);
  const end = slice.indexOf(0);
  return decoder.decode(end === -1 ? slice : slice.subarray(0, end));
}

function octal(block: Uint8Array, start: number, length: number) {
  const value = text(block, start, length).trim();
  return value ? Number.parseInt(value, 8) : 0;
}

function pax(data: Uint8Array) {
  const records: Record<string, string> = {};
  const body = decoder.decode(data);
  let offset = 0;
  while (offset < body.length) {
    const space = body.indexOf(" ", offset);
    if (space === -1) break;
    const length = Number.parseInt(body.slice(offset, space), 10);
    if (!length) break;
    const record = body.slice(space + 1, offset + length - 1);
    const equals = record.indexOf("=");
    if (equals !== -1)
      records[record.slice(0, equals)] = record.slice(equals + 1);
    offset += length;
  }
  return records;
}

export function untar(archive: Uint8Array): TarFiles {
  const files: Record<string, Uint8Array> = {};
  let commit: string | undefined;
  let mtime = 0;
  let nextPath: string | undefined;
  let offset = 0;
  while (offset + 512 <= archive.length) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const size = octal(header, 124, 12);
    const type = String.fromCharCode(header[156] || 48);
    const data = archive.subarray(offset + 512, offset + 512 + size);
    offset += 512 + Math.ceil(size / 512) * 512;
    if (type === "g") {
      commit = pax(data).comment ?? commit;
      continue;
    }
    if (type === "x") {
      nextPath = pax(data).path;
      continue;
    }
    if (type === "L") {
      nextPath = text(data, 0, data.length);
      continue;
    }
    const prefix = text(header, 345, 155);
    const name =
      nextPath ?? (prefix ? `${prefix}/` : "") + text(header, 0, 100);
    nextPath = undefined;
    if (type !== "0" && type !== "\0") continue;
    mtime = Math.max(mtime, octal(header, 136, 12) * 1000);
    // Strip GitHub's "<owner>-<repo>-<sha>/" top directory.
    const path = name.split("/").slice(1).join("/");
    if (path) files[path] = data.slice();
  }
  return { files, commit, mtime };
}
