import { randomUUID } from "node:crypto";
import { resolveAttendeeByEmail } from "../_lib/attendee-resolution.js";
import { falEnabled, buildFalPrompt, submitFalImageJob } from "../_lib/fal.js";
import { json, normalizeEmail, readJson } from "../_lib/http.js";
import { enforceRateLimit } from "../_lib/rate-limit.js";
import { saveImageJob } from "../_lib/storage.js";

function publicBaseUrl(request) {
  if (process.env.CHECKIN_PUBLIC_BASE_URL) {
    return process.env.CHECKIN_PUBLIC_BASE_URL;
  }

  const proto = request?.headers?.["x-forwarded-proto"] ?? request?.headers?.get?.("x-forwarded-proto") ?? "http";
  const host = request?.headers?.host ?? request?.headers?.get?.("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed" }, response);
  }

  const rate = await enforceRateLimit(request, {
    scope: "image-start",
    limit: 20,
    windowSec: 900,
  });
  if (rate.blocked) {
    return json(429, { error: `Too many image requests. Retry in ${rate.retryAfterSec}s.` }, response);
  }

  if (!falEnabled()) {
    return json(503, { error: "Image generation is not configured." }, response);
  }

  const body = await readJson(request);
  const attendeeName = String(body?.name ?? "Builder").trim().slice(0, 80);
  const email = normalizeEmail(body?.email);

  try {
    let attendeeEmailHash = "";
    if (email && email.includes("@")) {
      const attendee = await resolveAttendeeByEmail(email);
      attendeeEmailHash = attendee?.emailHash ?? "";
    }

    const jobId = randomUUID();
    const token = process.env.CHECKIN_FAL_WEBHOOK_TOKEN ?? "";
    const base = publicBaseUrl(request);
    const tokenQuery = token ? `&token=${encodeURIComponent(token)}` : "";
    const webhookUrl = `${base}/api/checkin/image-webhook?jobId=${encodeURIComponent(jobId)}${tokenQuery}`;

    const falPrompt = await buildFalPrompt(attendeeName);

    const falJob = await submitFalImageJob({
      prompt: falPrompt,
      webhookUrl,
    });

    await saveImageJob(jobId, {
      jobId,
      requestId: falJob.requestId,
      responseUrl: falJob.responseUrl,
      statusUrl: falJob.statusUrl,
      status: "queued",
      imageUrl: "",
      error: "",
      createdAt: new Date().toISOString(),
      attendeeName,
      attendeeEmailHash,
    });

    return json(200, {
      jobId,
      status: "queued",
    }, response);
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : "Failed to start image generation",
    }, response);
  }
}
