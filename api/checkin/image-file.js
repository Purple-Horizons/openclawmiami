import { getQueryParam } from "../_lib/http.js";
import { enforceRateLimit } from "../_lib/rate-limit.js";
import { getImageJob } from "../_lib/storage.js";

function parseJob(input) {
  if (!input) {
    return null;
  }

  if (typeof input === "string") {
    try {
      return JSON.parse(input);
    } catch {
      return null;
    }
  }

  return input;
}

function slugifyName(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function writeError(response, status, message) {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(JSON.stringify({ error: message }));
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    return writeError(response, 405, "Method not allowed");
  }

  const rate = await enforceRateLimit(request, {
    scope: "image-file",
    limit: 180,
    windowSec: 60,
  });
  if (rate.blocked) {
    return writeError(response, 429, `Too many image requests. Retry in ${rate.retryAfterSec}s.`);
  }

  const jobId = String(getQueryParam(request, "jobId") ?? "").trim();
  if (!jobId) {
    return writeError(response, 400, "Missing jobId");
  }

  const job = parseJob(await getImageJob(jobId));
  if (!job || job.status !== "completed" || !job.imageUrl) {
    return writeError(response, 404, "Image not available");
  }

  let upstream;
  try {
    upstream = await fetch(String(job.imageUrl));
  } catch {
    return writeError(response, 502, "Unable to fetch generated image");
  }

  if (!upstream.ok) {
    return writeError(response, 502, "Unable to fetch generated image");
  }

  const bytes = Buffer.from(await upstream.arrayBuffer());
  const contentType = upstream.headers.get("content-type") || "image/png";
  const attendeeSlug = slugifyName(job.attendeeName);
  const filename = attendeeSlug ? `openclawmiami-${attendeeSlug}.png` : "openclawmiami-attendee.png";

  response.statusCode = 200;
  response.setHeader("content-type", contentType);
  response.setHeader("content-length", String(bytes.length));
  response.setHeader("cache-control", "public, max-age=300, s-maxage=300");
  response.setHeader("content-disposition", `inline; filename=\"${filename}\"`);
  response.end(bytes);
}
