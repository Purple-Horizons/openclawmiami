import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { decryptJson, hashEmail } from "./security.js";

const ATTENDEE_FILE_PATH = resolve(
  process.cwd(),
  process.env.ATTENDEE_HASHES_PATH ?? "data/attendees-hashes.json",
);

let cachedAttendees = null;

async function loadAttendeesMap() {
  if (cachedAttendees) {
    return cachedAttendees;
  }

  const raw = await readFile(ATTENDEE_FILE_PATH, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed || typeof parsed !== "object" || !parsed.attendees || typeof parsed.attendees !== "object") {
    throw new Error("Invalid attendees-hashes.json format");
  }

  cachedAttendees = parsed.attendees;
  return cachedAttendees;
}

export async function findAttendeeByEmail(email) {
  const attendees = await loadAttendeesMap();
  const emailHash = hashEmail(email);
  const attendeeRecord = attendees[emailHash];
  const attendeePresent = Boolean(attendeeRecord);

  if (!attendeePresent) {
    return null;
  }

  let name = "Attendee";
  if (attendeeRecord && typeof attendeeRecord === "object" && typeof attendeeRecord.n === "string") {
    const decoded = decryptJson(attendeeRecord.n);
    const candidate = String(decoded?.name ?? "").trim();
    if (candidate) {
      name = candidate;
    }
  }

  return {
    emailHash,
    name,
  };
}
