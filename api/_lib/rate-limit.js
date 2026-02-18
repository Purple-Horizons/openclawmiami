const kvBaseUrl = process.env.KV_REST_API_URL;
const kvToken = process.env.KV_REST_API_TOKEN;

const memoryStore = new Map();

function hasKv() {
  return Boolean(kvBaseUrl && kvToken);
}

async function kvCommand(command) {
  const response = await fetch(kvBaseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${kvToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`KV command failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  return payload.result;
}

export function getClientIp(request) {
  const fromHeader = request?.headers?.["x-forwarded-for"] ?? request?.headers?.get?.("x-forwarded-for");
  if (fromHeader) {
    return String(fromHeader).split(",")[0].trim() || "unknown";
  }

  return String(request?.socket?.remoteAddress ?? "unknown");
}

export async function enforceRateLimit(request, {
  scope,
  limit,
  windowSec,
}) {
  const ip = getClientIp(request);
  const nowMs = Date.now();

  if (hasKv()) {
    const bucket = Math.floor(nowMs / (windowSec * 1000));
    const key = `checkin:rl:${scope}:${ip}:${bucket}`;
    const count = Number(await kvCommand(["INCR", key]));
    if (count === 1) {
      await kvCommand(["EXPIRE", key, windowSec + 3]);
    }

    if (count > limit) {
      return {
        blocked: true,
        retryAfterSec: windowSec,
      };
    }

    return {
      blocked: false,
      retryAfterSec: 0,
    };
  }

  const key = `${scope}:${ip}`;
  const current = memoryStore.get(key);

  if (!current || current.expiresAt <= nowMs) {
    memoryStore.set(key, {
      count: 1,
      expiresAt: nowMs + windowSec * 1000,
    });
    return { blocked: false, retryAfterSec: 0 };
  }

  current.count += 1;
  memoryStore.set(key, current);

  if (current.count > limit) {
    return {
      blocked: true,
      retryAfterSec: Math.max(1, Math.ceil((current.expiresAt - nowMs) / 1000)),
    };
  }

  return {
    blocked: false,
    retryAfterSec: 0,
  };
}
