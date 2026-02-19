import { extractImageUrl } from "../_lib/fal.js";
import { getQueryParam, json, readJson } from "../_lib/http.js";
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
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed" }, response);
  }

  const configuredToken = process.env.CHECKIN_FAL_WEBHOOK_TOKEN ?? "";
  const providedToken = String(getQueryParam(request, "token") ?? "");

  if (configuredToken && providedToken !== configuredToken) {
    return json(401, { error: "Invalid webhook token" }, response);
  }

  const jobId = String(getQueryParam(request, "jobId") ?? "").trim();
  if (!jobId) {
    return json(400, { error: "Missing jobId" }, response);
  }

  const current = parseJob(await getImageJob(jobId));
  if (!current) {
    return json(404, { error: "Image job not found" }, response);
  }

  const payload = await readJson(request);
  const imageUrl = extractImageUrl(payload);

  if (imageUrl) {
    await saveImageJob(jobId, {
      ...current,
      status: "completed",
      imageUrl,
      completedAt: new Date().toISOString(),
    });
    await attachImageToCheckinRecord(current, jobId);
    return json(200, { ok: true }, response);
  }

  const failed = payload?.status === "ERROR" || payload?.error;
  if (failed) {
    await saveImageJob(jobId, {
      ...current,
      status: "failed",
      error: String(payload?.error ?? "Image generation failed"),
      completedAt: new Date().toISOString(),
    });
  }

  return json(200, { ok: true }, response);
}
