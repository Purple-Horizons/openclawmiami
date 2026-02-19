const FAL_API_BASE = "https://queue.fal.run";

function getFalKey() {
  return process.env.FAL_KEY ?? "";
}

function cleanModelId() {
  return process.env.CHECKIN_FAL_MODEL ?? "fal-ai/nano-banana/edit";
}

export function falEnabled() {
  return Boolean(getFalKey() && process.env.CHECKIN_FAL_REFERENCE_IMAGE_URL);
}

export function buildFalPrompt(attendeeName) {
  const name = String(attendeeName ?? "Builder").trim() || "Builder";
  return [
    "Preserve the exact same character identity, face, expression, and the original headline layout.",
    "Create a fun OpenClaw Miami meetup poster variant with a fresh random accessory combo each generation.",
    "Accessories can include: retro hacker glasses, neon headphones, lobster pin, cyber tote, sticker-covered laptop, conference badge, and Miami tech swag.",
    "Keep the final output polished, bold, and social-share-ready.",
    `Add attendee name in tasteful title-case text: ${name}.`,
  ].join(" ");
}

export async function submitFalImageJob({ prompt, webhookUrl }) {
  const key = getFalKey();
  if (!key) {
    throw new Error("FAL_KEY is not configured.");
  }

  const imageUrl = process.env.CHECKIN_FAL_REFERENCE_IMAGE_URL;
  if (!imageUrl) {
    throw new Error("CHECKIN_FAL_REFERENCE_IMAGE_URL is not configured.");
  }

  const response = await fetch(`${FAL_API_BASE}/${cleanModelId()}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_urls: [imageUrl],
      num_images: 1,
      aspect_ratio: "1:1",
      output_format: "png",
      safety_tolerance: "4",
      webhook_url: webhookUrl,
    }),
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.detail ?? data?.error ?? text ?? "Failed to queue image generation");
  }

  return {
    requestId: String(data?.request_id ?? ""),
    statusUrl: String(data?.status_url ?? ""),
    responseUrl: String(data?.response_url ?? ""),
  };
}

export async function fetchFalResult(responseUrl) {
  const key = getFalKey();
  if (!key || !responseUrl) {
    return null;
  }

  const response = await fetch(responseUrl, {
    headers: {
      Authorization: `Key ${key}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function extractImageUrl(payload) {
  const direct = payload?.images?.[0]?.url;
  if (direct) {
    return String(direct);
  }

  const nested = payload?.result?.images?.[0]?.url;
  if (nested) {
    return String(nested);
  }

  return "";
}
