import { findAttendeeByEmail } from "./attendees.js";
import { decryptJson, encryptJson, hashEmail } from "./security.js";
import { getRegisteredAttendeeRecord, saveRegisteredAttendeeRecord } from "./storage.js";

export async function resolveAttendeeByEmail(email) {
  const preRegistered = await findAttendeeByEmail(email);
  if (preRegistered) {
    return {
      emailHash: preRegistered.emailHash,
      name: preRegistered.name,
      source: "pre_registered",
      referredBy: "",
    };
  }

  const emailHash = hashEmail(email);
  const registeredRecord = await getRegisteredAttendeeRecord(emailHash);
  if (!registeredRecord) {
    return null;
  }

  const parsed = decryptJson(registeredRecord);
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  return {
    emailHash,
    name: String(parsed.name ?? "Attendee").trim() || "Attendee",
    source: "walk_in",
    referredBy: String(parsed.referredBy ?? "").trim(),
  };
}

export async function registerWalkInAttendee(payload) {
  const email = String(payload.email ?? "").trim().toLowerCase();
  const firstName = String(payload.firstName ?? "").trim();
  const lastName = String(payload.lastName ?? "").trim();
  const referredBy = String(payload.referredBy ?? "").trim();
  const name = `${firstName} ${lastName}`.trim();

  const emailHash = hashEmail(email);

  await saveRegisteredAttendeeRecord(
    emailHash,
    encryptJson({
      name,
      referredBy,
      registeredAt: new Date().toISOString(),
    }),
  );

  return {
    emailHash,
    name,
    source: "walk_in",
    referredBy,
  };
}
