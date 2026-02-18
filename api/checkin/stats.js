import { json } from "../_lib/http.js";
import { enforceRateLimit } from "../_lib/rate-limit.js";
import { getStatsSnapshot } from "../_lib/storage.js";
import { categorizeObstacleThemes } from "../_lib/theme-categorizer.js";

function cleanedObstacles(input) {
  const cleaned = [];

  for (const item of input) {
    const text = String(item ?? "").trim();
    if (!text) {
      continue;
    }

    cleaned.push(text);
  }

  return cleaned;
}

export default async function handler(_request, response) {
  const rate = await enforceRateLimit(_request, {
    scope: "stats",
    limit: 120,
    windowSec: 60,
  });
  if (rate.blocked) {
    return json(429, { error: `Too many stats requests. Retry in ${rate.retryAfterSec}s.` }, response);
  }

  try {
    const snapshot = await getStatsSnapshot();
    const deployedYes = Number(snapshot.deployedYes ?? 0);
    const deployedNo = Number(snapshot.deployedNo ?? 0);
    const obstacles = cleanedObstacles(snapshot.obstacles);
    const topThemes = await categorizeObstacleThemes(obstacles);

    return json(200, {
      deployedYes,
      deployedNo,
      total: deployedYes + deployedNo,
      obstacles,
      topThemes,
    }, response);
  } catch (error) {
    return json(500, {
      error: "Unable to load stats",
      message: error instanceof Error ? error.message : String(error),
    }, response);
  }
}
