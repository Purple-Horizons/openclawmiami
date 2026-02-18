import { registerWalkInAttendee, resolveAttendeeByEmail } from "../_lib/attendee-resolution.js";
import { json, normalizeEmail, readJson } from "../_lib/http.js";
import { enforceRateLimit } from "../_lib/rate-limit.js";
import { getCheckinRecord } from "../_lib/storage.js";

function sanitizeText(value, maxLength = 80) {
  return String(value ?? "").trim().slice(0, maxLength);
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed" }, response);
  }

  const rate = await enforceRateLimit(request, {
    scope: "register",
    limit: 10,
    windowSec: 900,
  });
  if (rate.blocked) {
    return json(429, { error: `Too many registrations from this IP. Retry in ${rate.retryAfterSec}s.` }, response);
  }

  const body = await readJson(request);
  const email = normalizeEmail(body?.email);
  const firstName = sanitizeText(body?.firstName, 40);
  const lastName = sanitizeText(body?.lastName, 60);
  const referredBy = sanitizeText(body?.referredBy, 120);

  if (!email || !email.includes("@")) {
    return json(400, { error: "Please enter a valid email." }, response);
  }

  if (!firstName || !lastName) {
    return json(400, { error: "Please enter first and last name." }, response);
  }

  try {
    const existing = await resolveAttendeeByEmail(email);
    if (existing) {
      const checkin = await getCheckinRecord(existing.emailHash);
      return json(
        200,
        {
          registered: true,
          alreadyRegistered: true,
          name: existing.name,
          alreadyCheckedIn: Boolean(checkin),
        },
        response,
      );
    }

    const attendee = await registerWalkInAttendee({
      email,
      firstName,
      lastName,
      referredBy,
    });

    return json(
      200,
      {
        registered: true,
        alreadyRegistered: false,
        name: attendee.name,
        alreadyCheckedIn: false,
      },
      response,
    );
  } catch (error) {
    return json(
      500,
      {
        error: "Registration failed",
        message: error instanceof Error ? error.message : String(error),
      },
      response,
    );
  }
}
