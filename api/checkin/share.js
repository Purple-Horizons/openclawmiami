import { getQueryParam } from "../_lib/http.js";
import { enforceRateLimit } from "../_lib/rate-limit.js";
import { getImageJob } from "../_lib/storage.js";

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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function publicBaseUrl(request) {
  const proto = request?.headers?.["x-forwarded-proto"] ?? request?.headers?.get?.("x-forwarded-proto") ?? "https";
  const host = request?.headers?.host ?? request?.headers?.get?.("host") ?? "www.openclawmiami.com";
  return `${proto}://${host}`;
}

function writeHtml(response, status, body) {
  response.statusCode = status;
  response.setHeader("content-type", "text/html; charset=utf-8");
  response.setHeader("cache-control", "public, max-age=300, s-maxage=300");
  response.end(body);
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.statusCode = 405;
    response.setHeader("allow", "GET");
    response.end("Method not allowed");
    return;
  }

  const rate = await enforceRateLimit(request, {
    scope: "image-share-page",
    limit: 200,
    windowSec: 60,
  });
  if (rate.blocked) {
    response.statusCode = 429;
    response.end("Too many requests");
    return;
  }

  const jobId = String(getQueryParam(request, "jobId") ?? "").trim();
  if (!jobId) {
    return writeHtml(
      response,
      400,
      "<!doctype html><html><body><h1>Missing jobId</h1></body></html>",
    );
  }

  const job = parseJob(await getImageJob(jobId));
  if (!job || job.status !== "completed" || !job.imageUrl) {
    return writeHtml(
      response,
      404,
      "<!doctype html><html><body><h1>Image not found</h1></body></html>",
    );
  }

  const name = escapeHtml(String(job.attendeeName ?? "Builder"));
  const base = publicBaseUrl(request);
  const imageUrl = `${base}/api/checkin/image-file?jobId=${encodeURIComponent(jobId)}`;
  const title = escapeHtml(`OpenClaw Miami • ${name}`);
  const description = escapeHtml(`Checked in at OpenClaw Miami. ${name}'s generated event card.`);
  const canonicalUrl = `${base}/api/checkin/share?jobId=${encodeURIComponent(jobId)}`;

  return writeHtml(
    response,
    200,
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="noindex,nofollow" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="OpenClaw Miami" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:alt" content="${title}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
  </head>
  <body style="margin:0;background:#05070a;color:#d5f8df;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;display:grid;place-items:center;min-height:100vh;padding:24px;">
    <main style="max-width:560px;text-align:center;">
      <h1 style="font-size:28px;line-height:1.2;margin:0 0 10px;">${title}</h1>
      <p style="margin:0 0 20px;color:#9dd7ae;">Share-ready event card generated at check-in.</p>
      <img src="${imageUrl}" alt="${title}" style="width:100%;max-width:520px;aspect-ratio:1/1;object-fit:cover;border-radius:18px;border:1px solid rgba(34,197,94,0.35);box-shadow:0 24px 90px rgba(34,197,94,0.28);" />
    </main>
  </body>
</html>`,
  );
}
