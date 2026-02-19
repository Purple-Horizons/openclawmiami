import { resolveAttendeeByEmail } from "../_lib/attendee-resolution.js";
import { decryptJson } from "../_lib/security.js";
import { json, normalizeEmail, readJson } from "../_lib/http.js";
import { enforceRateLimit } from "../_lib/rate-limit.js";
import { getCheckinRecord } from "../_lib/storage.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed" }, response);
  }

  const rate = await enforceRateLimit(request, {
    scope: "lookup",
    limit: 40,
    windowSec: 60,
  });
  if (rate.blocked) {
    return json(429, { error: `Too many lookups. Retry in ${rate.retryAfterSec}s.` }, response);
  }

  const body = await readJson(request);
  const email = normalizeEmail(body?.email);

  if (!email || !email.includes("@")) {
    return json(400, { error: "Please enter a valid email." }, response);
  }

  try {
    const attendee = await resolveAttendeeByEmail(email);

    if (!attendee) {
      return json(200, {
        found: false,
      }, response);
    }

    const existingEncrypted = await getCheckinRecord(attendee.emailHash);
    const existing = existingEncrypted ? decryptJson(existingEncrypted) : null;

    return json(200, {
      found: true,
      name: attendee.name,
      alreadyCheckedIn: Boolean(existingEncrypted),
      generatedImageUrl: String(existing?.generatedImageUrl ?? ""),
      generatedShareUrl: String(existing?.generatedShareUrl ?? ""),
    }, response);
  } catch (error) {
    return json(500, {
      error: "Lookup failed",
      message: error instanceof Error ? error.message : String(error),
    }, response);
  }
}
