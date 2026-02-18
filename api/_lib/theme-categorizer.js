import { createHash } from "node:crypto";

const cache = new Map();
const CACHE_TTL_MS = 60000;

function normalize(text) {
  return String(text ?? "").toLowerCase();
}

function heuristicThemeFor(text) {
  const value = normalize(text);

  const checks = [
    {
      theme: "Setup & Installation",
      words: ["install", "setup", "set up", "docker", "env", "dependency", "config", "onboard"],
    },
    {
      theme: "Model/API & Cost",
      words: ["api key", "token", "openai", "anthropic", "model", "quota", "cost", "credits", "pricing"],
    },
    {
      theme: "Reliability & Debugging",
      words: ["error", "bug", "crash", "timeout", "fails", "failure", "debug", "unstable", "hallucinat"],
    },
    {
      theme: "Automation & Workflow",
      words: ["workflow", "automation", "agent", "task", "trigger", "schedule", "handoff", "orchestrat"],
    },
    {
      theme: "Integrations",
      words: ["integrat", "slack", "notion", "zapier", "n8n", "discord", "github", "webhook", "crm"],
    },
    {
      theme: "Security & Privacy",
      words: ["security", "secure", "privacy", "pii", "compliance", "permission", "safety", "safely"],
    },
    {
      theme: "Deployment & Hosting",
      words: ["deploy", "production", "host", "hosting", "server", "vercel", "cloud", "local"],
    },
  ];

  for (const check of checks) {
    if (check.words.some((word) => value.includes(word))) {
      return check.theme;
    }
  }

  return "General Questions";
}

function summarizeThemes(themesByObstacle, obstacles) {
  const counts = new Map();

  themesByObstacle.forEach((theme, index) => {
    const current = counts.get(theme) ?? { theme, count: 0, examples: [] };
    current.count += 1;
    if (current.examples.length < 2) {
      current.examples.push(obstacles[index]);
    }
    counts.set(theme, current);
  });

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((item) => ({
      theme: item.theme,
      count: item.count,
      example: item.examples[0] ?? "",
    }));
}

async function categorizeWithOpenRouter(obstacles) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";

  const openClawContext = process.env.OPENROUTER_OPENCLAW_CONTEXT ?? [
    "Event context:",
    "- This is an OpenClaw meetup check-in survey.",
    "- OpenClaw refers to AI agents, automations, local/hosted runtime setup, and integrations.",
    "- Attendees may mention model providers, API keys, prompt quality, memory, tool use, reliability, safety, or deployment blockers.",
  ].join("\n");

  const allowedThemes = [
    "Setup & Installation",
    "Model/API & Cost",
    "Reliability & Debugging",
    "Automation & Workflow",
    "Integrations",
    "Security & Privacy",
    "Deployment & Hosting",
    "General Questions",
  ];

  const prompt = [
    "Categorize each attendee obstacle into one short theme label.",
    openClawContext,
    "Use these theme labels when possible:",
    allowedThemes.map((theme) => `- ${theme}`).join("\n"),
    "Return strict JSON only with schema:",
    '{"themesByObstacle":["Theme 1","Theme 2"]}',
    "Keep exactly one theme label per obstacle in the same order.",
    "Obstacles:",
    ...obstacles.map((item, index) => `${index + 1}. ${item}`),
  ].join("\n\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are a strict JSON formatter. Output only valid JSON.",
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
      return null;
    }

    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content;
    if (!text) {
      return null;
    }

    const parsed = JSON.parse(text);
    const themesByObstacle = parsed?.themesByObstacle;

    if (!Array.isArray(themesByObstacle) || themesByObstacle.length !== obstacles.length) {
      return null;
    }

    return summarizeThemes(themesByObstacle.map((v) => String(v ?? "General Questions").slice(0, 50)), obstacles);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function categorizeObstacleThemes(obstacles) {
  const clean = obstacles.map((item) => String(item ?? "").trim()).filter(Boolean);
  if (!clean.length) {
    return [];
  }

  const key = createHash("sha1").update(JSON.stringify(clean)).digest("hex");
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.value;
  }

  const aiThemes = await categorizeWithOpenRouter(clean);
  const value = aiThemes ?? summarizeThemes(clean.map(heuristicThemeFor), clean);

  cache.set(key, { at: Date.now(), value });
  return value;
}
