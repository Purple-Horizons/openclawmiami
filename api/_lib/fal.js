const FAL_API_BASE = "https://queue.fal.run";
const OPENROUTER_API_BASE = "https://openrouter.ai/api/v1/chat/completions";

const LOCAL_ACCESSORY_POOL = [
  "neon headphones",
  "lobster pin",
  "cyber tote",
  "sticker-covered laptop",
  "conference badge",
  "Miami tech swag wristband",
  "pixel-art enamel pin pack",
  "mechanical keyboard sling",
  "retro pager clipped to belt",
  "RGB windbreaker",
  "holographic fanny pack",
  "hacker sticker bomb backpack",
  "tiny robot shoulder companion",
  "hackathon medal lanyard",
  "LED shoelaces",
  "chrome cyber gloves",
  "terminal-green scarf",
  "micro-drone keychain",
];

function getFalKey() {
  return process.env.FAL_KEY ?? "";
}

function cleanModelId() {
  return process.env.CHECKIN_FAL_MODEL ?? "fal-ai/nano-banana/edit";
}

export function falEnabled() {
  return Boolean(getFalKey() && process.env.CHECKIN_FAL_REFERENCE_IMAGE_URL);
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function localAccessoryCombo() {
  return shuffle(LOCAL_ACCESSORY_POOL).slice(0, 5);
}

function sanitizeAccessoryList(values) {
  return values
    .map((item) => String(item ?? "").trim().toLowerCase())
    .map((item) => item.replace(/\.$/, ""))
    .filter(Boolean)
    .filter((item) => !item.includes("glasses"))
    .filter((item) => item.length <= 60)
    .filter((item, index, list) => list.indexOf(item) === index)
    .slice(0, 7);
}

async function generateAiAccessories() {
  const apiKey = process.env.OPENROUTER_API_KEY ?? "";
  if (!apiKey) {
    return [];
  }

  const model = process.env.CHECKIN_FAL_ACCESSORY_MODEL ?? process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
  const openClawContext = process.env.OPENROUTER_OPENCLAW_CONTEXT ?? [
    "OpenClaw is an AI-agent meetup culture.",
    "Style target: nerdy, playful, modern builder energy.",
  ].join("\n");

  const prompt = [
    "Generate unique accessory ideas for a meetup poster character.",
    openClawContext,
    "Rules:",
    "- Return strict JSON only with schema: {\"accessories\":[\"item 1\",\"item 2\"]}",
    "- 5 to 7 items, each short (2-5 words), visually distinct.",
    "- Do not include glasses, sunglasses, or eyewear.",
    "- Avoid duplicates and avoid repeating the same nouns.",
    "- Items should be wearable or held props for a tech meetup attendee.",
  ].join("\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(OPENROUTER_API_BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 1.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You output strict JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content;
    if (!text) {
      return [];
    }

    const parsed = JSON.parse(text);
    const list = Array.isArray(parsed?.accessories) ? parsed.accessories : [];
    return sanitizeAccessoryList(list);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function buildFalPrompt(attendeeName) {
  const name = String(attendeeName ?? "Builder").trim() || "Builder";
  const accessories = sanitizeAccessoryList(await generateAiAccessories());
  const resolvedAccessories = accessories.length ? accessories : localAccessoryCombo();

  return [
    "Preserve the exact same character identity from the reference image, face, expression, and the original headline layout.",
    "Create a fun OpenClaw Miami meetup poster variant with a fresh random accessory combo each generation.",
    `Accessories can include: ${resolvedAccessories.join(", ")}.`,
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
