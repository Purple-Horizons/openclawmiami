export function json(status, body, res) {
  if (res && typeof res.setHeader === "function") {
    res.statusCode = status;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("cache-control", "no-store");
    res.end(JSON.stringify(body));
    return;
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function readJson(request) {
  if (typeof request?.json === "function") {
    try {
      return await request.json();
    } catch {
      return null;
    }
  }

  const body = request?.body;
  if (body && typeof body === "object") {
    return body;
  }

  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }

  if (request && typeof request.on === "function") {
    return await new Promise((resolve) => {
      let data = "";
      request.on("data", (chunk) => {
        data += chunk;
      });
      request.on("end", () => {
        if (!data) {
          resolve(null);
          return;
        }

        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    });
  }

  try {
    return null;
  } catch {
    return null;
  }
}

export function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function getQueryParam(request, key) {
  if (request?.query && typeof request.query === "object") {
    const value = request.query[key];
    if (Array.isArray(value)) {
      return value[0] ?? null;
    }
    return value ?? null;
  }

  try {
    const url = new URL(request.url, "http://localhost");
    return url.searchParams.get(key);
  } catch {
    return null;
  }
}
