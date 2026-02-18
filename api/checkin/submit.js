import { resolveAttendeeByEmail } from "../_lib/attendee-resolution.js";
import { decryptJson, encryptJson } from "../_lib/security.js";
import { json, normalizeEmail, readJson } from "../_lib/http.js";
import { enforceRateLimit } from "../_lib/rate-limit.js";
import {
  appendObstacle,
  getCheckinRecord,
  incrementDeployedCount,
  saveCheckinRecord,
} from "../_lib/storage.js";

function sanitizeObstacle(value) {
  return String(value ?? "").trim().slice(0, 240);
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed" }, response);
  }

  const rate = await enforceRateLimit(request, {
    scope: "submit",
    limit: 20,
    windowSec: 900,
  });
  if (rate.blocked) {
    return json(429, { error: `Too many check-in attempts. Retry in ${rate.retryAfterSec}s.` }, response);
  }

  const body = await readJson(request);
  const email = normalizeEmail(body?.email);
  const deployedAgent = body?.deployedAgent;
  const obstacle = sanitizeObstacle(body?.obstacle);

  if (!email || !email.includes("@")) {
    return json(400, { error: "Please enter a valid email." }, response);
  }

  if (typeof deployedAgent !== "boolean") {
    return json(400, { error: "Please answer whether you have deployed an OpenClaw agent yet." }, response);
  }

  if (deployedAgent && !obstacle) {
    return json(400, { error: "Please share your biggest obstacle before checking in." }, response);
  }

  try {
    const attendee = await resolveAttendeeByEmail(email);

    if (!attendee) {
      return json(404, { error: "Attendee not found" }, response);
    }

    const existingEncrypted = await getCheckinRecord(attendee.emailHash);
    if (existingEncrypted) {
      const existing = decryptJson(existingEncrypted);
      return json(200, {
        checkedIn: true,
        alreadyCheckedIn: true,
        checkedInAt: existing?.checkedInAt ?? null,
      }, response);
    }

    const record = {
      name: attendee.name,
      email,
      deployedAgent,
      obstacle: deployedAgent ? obstacle : "",
      source: attendee.source,
      referredBy: attendee.referredBy ?? "",
      checkedInAt: new Date().toISOString(),
    };

    await saveCheckinRecord(attendee.emailHash, encryptJson(record));
    await incrementDeployedCount(deployedAgent);
    await appendObstacle(record.obstacle);

    return json(200, {
      checkedIn: true,
      alreadyCheckedIn: false,
      checkedInAt: record.checkedInAt,
    }, response);
  } catch (error) {
    return json(500, {
      error: "Check-in failed",
      message: error instanceof Error ? error.message : String(error),
    }, response);
  }
}
