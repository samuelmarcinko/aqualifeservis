import { describe, it, expect, beforeAll } from "vitest";
import { encryptSecret, decryptSecret, isEncrypted } from "./crypto";

beforeAll(() => {
  process.env.APP_ENCRYPTION_KEY = "test-encryption-key-please-change-1234567890";
});

describe("crypto", () => {
  it("round-trips a secret", () => {
    const secret = "super-secret-smtp-password-ľščťžý";
    const enc = encryptSecret(secret);
    expect(enc).not.toContain(secret);
    expect(isEncrypted(enc)).toBe(true);
    expect(decryptSecret(enc)).toBe(secret);
  });

  it("produces different ciphertext each time (random IV)", () => {
    expect(encryptSecret("x")).not.toBe(encryptSecret("x"));
  });

  it("detects non-encrypted values", () => {
    expect(isEncrypted("plaintext")).toBe(false);
    expect(isEncrypted("")).toBe(false);
    expect(isEncrypted(null)).toBe(false);
  });
});
