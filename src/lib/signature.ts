import crypto from "node:crypto";

/**
 * Verify Meta's X-Hub-Signature-256 header against the raw request body.
 * The header looks like "sha256=<hex>" and is an HMAC-SHA256 of the raw
 * body keyed with the app secret.
 */
export function verifySignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  if (!signatureHeader || !appSecret) return false;

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");

  const received = Buffer.from(signatureHeader);
  const computed = Buffer.from(expected);

  if (received.length !== computed.length) return false;
  return crypto.timingSafeEqual(received, computed);
}
