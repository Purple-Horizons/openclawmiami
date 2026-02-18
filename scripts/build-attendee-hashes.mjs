import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { encryptJson } from "../api/_lib/security.js";

function parseArgs(argv) {
  const args = {
    input: "",
    output: "data/attendees-hashes.json",
    pepper: process.env.CHECKIN_EMAIL_HASH_PEPPER ?? "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if (token === "--input" && next) {
      args.input = next;
      i += 1;
    } else if (token === "--output" && next) {
      args.output = next;
      i += 1;
    } else if (token === "--pepper" && next) {
      args.pepper = next;
      i += 1;
    }
  }

  if (!args.input) {
    throw new Error("Missing required --input path to the survey CSV.");
  }

  return args;
}

function splitCsvLine(line) {
  const fields = [];
  let value = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const next = line[i + 1];
      if (insideQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      fields.push(value);
      value = "";
      continue;
    }

    value += char;
  }

  fields.push(value);
  return fields;
}

function parseCsv(content) {
  const rows = [];
  let line = "";
  let insideQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];

    if (char === '"') {
      const next = content[i + 1];
      if (insideQuotes && next === '"') {
        line += '"';
        i += 1;
        continue;
      }

      insideQuotes = !insideQuotes;
      line += char;
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (line.trim()) {
        rows.push(splitCsvLine(line));
      }
      line = "";
      if (char === "\r" && content[i + 1] === "\n") {
        i += 1;
      }
      continue;
    }

    line += char;
  }

  if (line.trim()) {
    rows.push(splitCsvLine(line));
  }

  return rows;
}

function normalizeHeader(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/^\ufeff/, "")
    .trim();
}

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function requireEncryptionKey() {
  if (!process.env.CHECKIN_ENCRYPTION_KEY) {
    throw new Error("CHECKIN_ENCRYPTION_KEY is required to store attendee names securely.");
  }
}

function hashEmail(email, pepper) {
  return createHash("sha256").update(`${pepper}:${email}`).digest("hex");
}

function pickHeaderIndex(headers, options) {
  for (const option of options) {
    const idx = headers.indexOf(option);
    if (idx !== -1) {
      return idx;
    }
  }
  return -1;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = resolve(process.cwd(), args.input);
  const outputPath = resolve(process.cwd(), args.output);

  const content = await readFile(inputPath, "utf8");
  const rows = parseCsv(content);
  if (rows.length < 2) {
    throw new Error("CSV has no attendee rows.");
  }

  const headers = rows[0].map(normalizeHeader);
  const emailIndex = pickHeaderIndex(headers, ["contact - email", "email", "e-mail"]);
  const nameIndex = pickHeaderIndex(headers, ["name", "full name"]);

  if (emailIndex === -1) {
    throw new Error("Could not find required Email column.");
  }
  requireEncryptionKey();

  const attendees = {};

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const email = normalizeEmail(row[emailIndex]);
    if (!email || !email.includes("@")) {
      continue;
    }

    const rawName = nameIndex !== -1 ? String(row[nameIndex] ?? "").trim() : "";
    const fallbackName = email.split("@")[0];
    const name = rawName || fallbackName;

    const emailHash = hashEmail(email, args.pepper);
    if (!attendees[emailHash]) {
      attendees[emailHash] = {
        n: encryptJson({ name }),
      };
    }
  }

  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    totalAttendees: Object.keys(attendees).length,
    hashAlgorithm: "sha256",
    nameEncoding: "encrypted-json-aes-256-gcm",
    attendees,
  };

  await writeFile(outputPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Wrote ${payload.totalAttendees} hashed attendees to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
