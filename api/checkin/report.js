import { constantTimeEqual, decryptJson } from "../_lib/security.js";
import { json } from "../_lib/http.js";
import { enforceRateLimit } from "../_lib/rate-limit.js";
import { listAllEncryptedCheckinRecords } from "../_lib/storage.js";

function readReportToken(request) {
  const headerToken = request?.headers?.["x-report-token"] ?? request?.headers?.get?.("x-report-token");
  return String(headerToken ?? "");
}

function hasReportAccess(request) {
  const configuredToken = process.env.CHECKIN_REPORT_TOKEN;
  if (!configuredToken) {
    return false;
  }

  const providedToken = readReportToken(request);

  return constantTimeEqual(providedToken, configuredToken);
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    return json(405, { error: "Method not allowed" }, response);
  }

  const globalRate = await enforceRateLimit(request, {
    scope: "report",
    limit: 30,
    windowSec: 300,
  });
  if (globalRate.blocked) {
    return json(429, { error: `Too many report requests. Retry in ${globalRate.retryAfterSec}s.` }, response);
  }

  if (!process.env.CHECKIN_REPORT_TOKEN) {
    return json(503, { error: "Report is disabled until CHECKIN_REPORT_TOKEN is configured." }, response);
  }

  if (!hasReportAccess(request)) {
    const authFailRate = await enforceRateLimit(request, {
      scope: "report-auth-fail",
      limit: 8,
      windowSec: 900,
    });

    if (authFailRate.blocked) {
      return json(429, { error: `Too many failed report auth attempts. Retry in ${authFailRate.retryAfterSec}s.` }, response);
    }

    return json(401, { error: "Unauthorized report access" }, response);
  }

  try {
    const encryptedRecords = await listAllEncryptedCheckinRecords();
    const rows = encryptedRecords
      .map((entry) => decryptJson(entry))
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => ({
        name: String(entry.name ?? ""),
        email: String(entry.email ?? ""),
        deployedAgent: Boolean(entry.deployedAgent),
        obstacle: String(entry.obstacle ?? ""),
        source: String(entry.source ?? "pre_registered"),
        referredBy: String(entry.referredBy ?? ""),
        checkedInAt: String(entry.checkedInAt ?? ""),
      }))
      .sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt));

    return json(200, { total: rows.length, rows }, response);
  } catch (error) {
    return json(
      500,
      {
        error: "Unable to load report",
        message: error instanceof Error ? error.message : String(error),
      },
      response,
    );
  }
}
