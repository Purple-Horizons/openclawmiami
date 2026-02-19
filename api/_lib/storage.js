import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const kvBaseUrl = process.env.KV_REST_API_URL;
const kvToken = process.env.KV_REST_API_TOKEN;

const fileStorePath = resolve(process.cwd(), process.env.CHECKIN_FILE_STORE_PATH ?? ".checkin-data/checkins.json");

function createEmptyStore() {
  return {
    records: {},
    recordIndex: [],
    registeredAttendees: {},
    registeredIndex: [],
    stats: {
      deployedYes: 0,
      deployedNo: 0,
    },
    obstacles: [],
    imageJobs: {},
  };
}

function normalizeStore(store) {
  const base = createEmptyStore();

  return {
    records: typeof store?.records === "object" && store.records ? store.records : base.records,
    recordIndex: Array.isArray(store?.recordIndex) ? store.recordIndex : Object.keys(store?.records ?? {}),
    registeredAttendees:
      typeof store?.registeredAttendees === "object" && store.registeredAttendees
        ? store.registeredAttendees
        : base.registeredAttendees,
    registeredIndex: Array.isArray(store?.registeredIndex)
      ? store.registeredIndex
      : Object.keys(store?.registeredAttendees ?? {}),
    stats: {
      deployedYes: Number(store?.stats?.deployedYes ?? 0),
      deployedNo: Number(store?.stats?.deployedNo ?? 0),
    },
    obstacles: Array.isArray(store?.obstacles) ? store.obstacles : base.obstacles,
    imageJobs: typeof store?.imageJobs === "object" && store.imageJobs ? store.imageJobs : base.imageJobs,
  };
}

function hasKv() {
  return Boolean(kvBaseUrl && kvToken);
}

async function kvCommand(command) {
  const response = await fetch(kvBaseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${kvToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`KV command failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  return payload.result;
}

async function loadFileStore() {
  try {
    const raw = await readFile(fileStorePath, "utf8");
    return normalizeStore(JSON.parse(raw));
  } catch {
    return createEmptyStore();
  }
}

async function saveFileStore(store) {
  await mkdir(dirname(fileStorePath), { recursive: true });
  await writeFile(fileStorePath, JSON.stringify(store, null, 2), "utf8");
}

export async function getCheckinRecord(emailHash) {
  if (hasKv()) {
    return await kvCommand(["GET", `checkin:record:${emailHash}`]);
  }

  const store = await loadFileStore();
  return store.records[emailHash] ?? null;
}

export async function saveCheckinRecord(emailHash, encryptedRecord) {
  if (hasKv()) {
    await kvCommand(["SET", `checkin:record:${emailHash}`, encryptedRecord]);
    await kvCommand(["SADD", "checkin:records:index", emailHash]);
    return;
  }

  const store = await loadFileStore();
  store.records[emailHash] = encryptedRecord;
  if (!store.recordIndex.includes(emailHash)) {
    store.recordIndex.push(emailHash);
  }
  await saveFileStore(store);
}

export async function listAllEncryptedCheckinRecords() {
  if (hasKv()) {
    const hashes = await kvCommand(["SMEMBERS", "checkin:records:index"]);
    if (!Array.isArray(hashes) || !hashes.length) {
      return [];
    }

    const records = await Promise.all(hashes.map((hash) => kvCommand(["GET", `checkin:record:${hash}`])));
    return records.filter(Boolean);
  }

  const store = await loadFileStore();
  return Object.values(store.records).filter(Boolean);
}

export async function getRegisteredAttendeeRecord(emailHash) {
  if (hasKv()) {
    return await kvCommand(["GET", `checkin:registered:${emailHash}`]);
  }

  const store = await loadFileStore();
  return store.registeredAttendees[emailHash] ?? null;
}

export async function saveRegisteredAttendeeRecord(emailHash, encryptedRecord) {
  if (hasKv()) {
    await kvCommand(["SET", `checkin:registered:${emailHash}`, encryptedRecord]);
    await kvCommand(["SADD", "checkin:registered:index", emailHash]);
    return;
  }

  const store = await loadFileStore();
  store.registeredAttendees[emailHash] = encryptedRecord;
  if (!store.registeredIndex.includes(emailHash)) {
    store.registeredIndex.push(emailHash);
  }
  await saveFileStore(store);
}

export async function incrementDeployedCount(value) {
  const key = value ? "checkin:stats:deployed_yes" : "checkin:stats:deployed_no";

  if (hasKv()) {
    await kvCommand(["INCR", key]);
    return;
  }

  const store = await loadFileStore();
  if (value) {
    store.stats.deployedYes += 1;
  } else {
    store.stats.deployedNo += 1;
  }
  await saveFileStore(store);
}

export async function appendObstacle(text) {
  if (!text) {
    return;
  }

  if (hasKv()) {
    await kvCommand(["LPUSH", "checkin:obstacles", text]);
    await kvCommand(["LTRIM", "checkin:obstacles", 0, 199]);
    return;
  }

  const store = await loadFileStore();
  store.obstacles.unshift(text);
  store.obstacles = store.obstacles.slice(0, 200);
  await saveFileStore(store);
}

export async function getStatsSnapshot() {
  if (hasKv()) {
    const [yesRaw, noRaw, obstacles] = await Promise.all([
      kvCommand(["GET", "checkin:stats:deployed_yes"]),
      kvCommand(["GET", "checkin:stats:deployed_no"]),
      kvCommand(["LRANGE", "checkin:obstacles", 0, 199]),
    ]);

    const deployedYes = Number(yesRaw ?? 0);
    const deployedNo = Number(noRaw ?? 0);

    return {
      deployedYes,
      deployedNo,
      obstacles: Array.isArray(obstacles) ? obstacles : [],
    };
  }

  const store = await loadFileStore();
  return {
    deployedYes: Number(store.stats.deployedYes ?? 0),
    deployedNo: Number(store.stats.deployedNo ?? 0),
    obstacles: Array.isArray(store.obstacles) ? store.obstacles.slice(0, 200) : [],
  };
}

export async function getImageJob(jobId) {
  if (hasKv()) {
    return await kvCommand(["GET", `checkin:image-job:${jobId}`]);
  }

  const store = await loadFileStore();
  return store.imageJobs[jobId] ?? null;
}

export async function saveImageJob(jobId, payload) {
  if (hasKv()) {
    await kvCommand(["SET", `checkin:image-job:${jobId}`, JSON.stringify(payload)]);
    return;
  }

  const store = await loadFileStore();
  store.imageJobs[jobId] = payload;
  await saveFileStore(store);
}
