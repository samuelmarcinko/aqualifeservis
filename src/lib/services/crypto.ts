import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

/**
 * Symmetric encryption for sensitive settings (SMTP password).
 * AES-256-GCM. The key is derived from APP_ENCRYPTION_KEY.
 *
 * Stored format: base64(iv).base64(authTag).base64(ciphertext)
 */

function getKey(): Buffer {
  const secret = process.env.APP_ENCRYPTION_KEY;
  if (!secret || secret.length < 16) {
    throw new Error(
      "APP_ENCRYPTION_KEY nie je nastavený alebo je príliš krátky (min. 16 znakov).",
    );
  }
  // Derive a 32-byte key deterministically from the provided secret.
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}

export function decryptSecret(payload: string): string {
  const key = getKey();
  const parts = payload.split(".");
  if (parts.length !== 3) throw new Error("Neplatný formát šifrovaného údaja.");
  const [ivB64, tagB64, dataB64] = parts as [string, string, string];
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

/** Whether a value looks like our encrypted payload (has 3 base64 parts). */
export function isEncrypted(value: string | null | undefined): boolean {
  return !!value && value.split(".").length === 3;
}
