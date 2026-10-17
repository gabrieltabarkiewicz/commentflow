import crypto from "node:crypto";
import { env } from "@/lib/env";

// AES-256-GCM encryption for secrets at rest (access tokens).
// Values are stored as "enc:v1:<base64(iv|tag|ciphertext)>".
// If no ENCRYPTION_KEY is set, values are stored as-is (plaintext) so the app
// still runs in dev; set a key before production.

const PREFIX = "enc:v1:";
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey(): Buffer | null {
  const raw = env.encryptionKey;
  if (!raw) return null;
  // Derive a 32-byte key from any passphrase.
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptSecret(plain: string): string {
  const key = getKey();
  if (!key) return plain;
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptSecret(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!stored.startsWith(PREFIX)) return stored; // legacy plaintext
  const key = getKey();
  if (!key) return null; // encrypted but no key available
  try {
    const buf = Buffer.from(stored.slice(PREFIX.length), "base64");
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const data = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(data), decipher.final()]);
    return dec.toString("utf8");
  } catch {
    return null;
  }
}

export function isEncryptionEnabled(): boolean {
  return getKey() !== null;
}
