import { put, del } from "@vercel/blob";

/**
 * Vercel Blob storage helper. Files are stored privately (access controlled at
 * the application layer); public URLs are random and unguessable but we always
 * proxy downloads through authorized route handlers.
 */

export interface UploadResult {
  url: string;
  pathname: string;
}

function safeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
}

export async function uploadBlob(
  path: string,
  data: Buffer | Uint8Array | string,
  contentType: string,
): Promise<UploadResult> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const cleanPath = path
    .split("/")
    .map((seg, i, arr) => (i === arr.length - 1 ? safeName(seg) : seg.replace(/[^\w-]+/g, "_")))
    .join("/");
  const result = await put(cleanPath, data as Buffer, {
    access: "public",
    contentType,
    addRandomSuffix: true,
    token,
  });
  return { url: result.url, pathname: result.pathname };
}

export async function deleteBlob(url: string): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  try {
    await del(url, { token });
  } catch {
    // Best-effort deletion; ignore failures (e.g. already deleted).
  }
}

export { safeName };
