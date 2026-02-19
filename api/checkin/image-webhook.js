import { extractImageUrl } from "../_lib/fal.js";
import { getQueryParam, json, readJson } from "../_lib/http.js";
import { getImageJob, saveImageJob } from "../_lib/storage.js";

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
