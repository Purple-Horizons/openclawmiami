import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function getAesKey() {
  const raw = process.env.CHECKIN_ENCRYPTION_KEY;
  if (!raw) {
    return null;
  }

  return createHash("sha256").update(raw).digest();
}

export function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function hashEmail(email) {
  const pepper = process.env.CHECKIN_EMAIL_HASH_PEPPER ?? "";
  return sha256Hex(`${pepper}:${email}`);
}

export function encryptJson(data) {
  const key = getAesKey();
  if (!key) {
    return JSON.stringify(data);
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(data), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return JSON.stringify({
    v: 1,
    alg: "aes-256-gcm",
    iv: iv.toString("base64"),
    tag: authTag.toString("base64"),
    data: encrypted.toString("base64"),
  });
}

export function decryptJson(payload) {
  if (!payload) {
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return null;
  }

  if (!parsed || parsed.alg !== "aes-256-gcm") {
    return parsed;
  }

  const key = getAesKey();
  if (!key) {
    return null;
  }

  try {
    const iv = Buffer.from(parsed.iv, "base64");
    const tag = Buffer.from(parsed.tag, "base64");
    const data = Buffer.from(parsed.data, "base64");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
    return JSON.parse(plaintext);
  } catch {
    return null;
  }
}

export function constantTimeEqual(left, right) {
  const a = Buffer.from(String(left ?? ""), "utf8");
  const b = Buffer.from(String(right ?? ""), "utf8");

  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a[i] ^ b[i];
  }

  return mismatch === 0;
}
