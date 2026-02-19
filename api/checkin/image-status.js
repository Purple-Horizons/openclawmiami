import { extractImageUrl, fetchFalResult } from "../_lib/fal.js";
import { getQueryParam, json } from "../_lib/http.js";
import { enforceRateLimit } from "../_lib/rate-limit.js";
import { decryptJson, encryptJson } from "../_lib/security.js";
import { getCheckinRecord, getImageJob, saveCheckinRecord, saveImageJob } from "../_lib/storage.js";

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

function withProxyUrl(job) {
  if (!job || job.status !== "completed") {
    return job;
  }

  return {
    ...job,
    imageProxyUrl: `/api/checkin/image-file?jobId=${encodeURIComponent(job.jobId)}`,
  };
}

function proxyUrlFor(jobId) {
  return `/api/checkin/image-file?jobId=${encodeURIComponent(jobId)}`;
}

function shareUrlFor(jobId) {
  return `/api/checkin/share?jobId=${encodeURIComponent(jobId)}`;
}

async function attachImageToCheckinRecord(current, jobId) {
  const emailHash = String(current?.attendeeEmailHash ?? "");
  if (!emailHash) {
    return;
  }

  const existingEncrypted = await getCheckinRecord(emailHash);
  if (!existingEncrypted) {
    return;
  }

  const existing = decryptJson(existingEncrypted);
  if (!existing || typeof existing !== "object") {
    return;
  }

  const next = {
    ...existing,
    generatedImageJobId: jobId,
    generatedImageUrl: proxyUrlFor(jobId),
    generatedShareUrl: shareUrlFor(jobId),
    generatedImageUpdatedAt: new Date().toISOString(),
  };

  await saveCheckinRecord(emailHash, encryptJson(next));
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    return json(405, { error: "Method not allowed" }, response);
  }

  const rate = await enforceRateLimit(request, {
    scope: "image-status",
    limit: 120,
    windowSec: 60,
  });
  if (rate.blocked) {
    return json(429, { error: `Too many status requests. Retry in ${rate.retryAfterSec}s.` }, response);
  }

  const jobId = String(getQueryParam(request, "jobId") ?? "").trim();
  if (!jobId) {
    return json(400, { error: "Missing jobId" }, response);
  }

  const current = parseJob(await getImageJob(jobId));
  if (!current) {
    return json(404, { error: "Image job not found" }, response);
  }
  current.jobId = current.jobId || jobId;

  if (current.status === "completed" || current.status === "failed") {
    return json(200, withProxyUrl(current), response);
  }

  if (!current.responseUrl) {
    return json(200, current, response);
  }

  const falResult = await fetchFalResult(current.responseUrl);
  if (!falResult) {
    return json(200, current, response);
  }

  const imageUrl = extractImageUrl(falResult);
  if (!imageUrl) {
    return json(200, current, response);
  }

  const updated = {
    ...current,
    jobId,
    status: "completed",
    imageUrl,
    completedAt: new Date().toISOString(),
  };

  await saveImageJob(jobId, updated);
  await attachImageToCheckinRecord(updated, jobId);
  return json(200, withProxyUrl(updated), response);
}
