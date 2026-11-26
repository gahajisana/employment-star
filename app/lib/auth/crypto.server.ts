const encoder = new TextEncoder();

/** Generates a uniform N-digit numeric OTP using Web Crypto rejection sampling. */
export function generateNumericOtp(digits = 6): string {
  const modulo = 10 ** digits;
  const maxUnbiased = Math.floor(0x1_0000_0000 / modulo) * modulo;
  const buf = new Uint32Array(1);

  while (true) {
    crypto.getRandomValues(buf);
    const value = buf[0];
    if (value < maxUnbiased) {
      return String(value % modulo).padStart(digits, "0");
    }
  }
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Computes an HMAC-SHA256 hex digest bound to both secret and challenge ID. */
export async function hashOtpCode(
  secret: string,
  challengeId: string,
  code: string,
): Promise<string> {
  const key = await importHmacKey(secret);
  const payload = encoder.encode(`${challengeId}:${code}`);
  const signature = await crypto.subtle.sign("HMAC", key, payload);
  return bytesToHex(new Uint8Array(signature));
}

/** Constant-time string comparison for fixed-length hex digests. */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Verifies an OTP against an HMAC-SHA256 digest in constant time. */
export async function verifyOtpHash(
  secret: string,
  challengeId: string,
  code: string,
  expectedHex: string,
): Promise<boolean> {
  const computed = await hashOtpCode(secret, challengeId, code);
  return timingSafeEqualHex(computed, expectedHex);
}
