import { json, getQueryParam } from "../_lib/http.js";

const YOUTUBE_URL = "https://www.youtube.com";
const CHANNEL_HANDLE = "OpenClawMiami";

function decodeEntities(value) {
  return String(value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTagValue(xml, tagName) {
  const pattern = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`);
  const match = xml.match(pattern);
  if (!match) {
    return "";
  }

  return decodeEntities(match[1].trim());
}

function extractThumbnail(entryXml, videoId) {
  const thumbMatch = entryXml.match(/<media:thumbnail[^>]*url="([^"]+)"/);
  if (thumbMatch?.[1]) {
    return thumbMatch[1];
  }

  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "";
}

function parseFeedEntries(feedXml) {
  const entries = feedXml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];

  return entries
    .map((entryXml) => {
      const videoId = extractTagValue(entryXml, "yt:videoId");
      const publishedAt = extractTagValue(entryXml, "published");
      const title = extractTagValue(entryXml, "title");
      const description = extractTagValue(entryXml, "media:description");

      return {
        id: videoId,
        title,
        description,
        publishedAt,
        url: videoId ? `${YOUTUBE_URL}/watch?v=${videoId}` : "",
        thumbnail: extractThumbnail(entryXml, videoId),
      };
    })
    .filter((entry) => entry.id && entry.title);
}

async function resolveChannelId(handle) {
  const channelResponse = await fetch(`${YOUTUBE_URL}/@${handle}`);
  if (!channelResponse.ok) {
    throw new Error(`Unable to load channel page (${channelResponse.status})`);
  }

  const html = await channelResponse.text();
  const channelIdMatch = html.match(/"externalId":"(UC[^"]+)"/);

  if (!channelIdMatch?.[1]) {
    throw new Error("Unable to resolve YouTube channel ID from handle");
  }

  return channelIdMatch[1];
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    return json(405, { error: "Method not allowed" }, response);
  }

  const handle = String(getQueryParam(request, "handle") ?? CHANNEL_HANDLE).replace(/^@/, "").trim();

  if (!handle) {
    return json(400, { error: "Missing channel handle" }, response);
  }

  try {
    const channelId = await resolveChannelId(handle);
    const feedResponse = await fetch(`${YOUTUBE_URL}/feeds/videos.xml?channel_id=${channelId}`);

    if (!feedResponse.ok) {
      throw new Error(`Unable to load feed (${feedResponse.status})`);
    }

    const feedXml = await feedResponse.text();
    const channelTitle = extractTagValue(feedXml, "title");
    const entries = parseFeedEntries(feedXml);

    return json(
      200,
      {
        channelId,
        channelHandle: `@${handle}`,
        channelTitle,
        videos: entries,
      },
      response,
    );
  } catch (error) {
    return json(
      500,
      {
        error: "Unable to fetch YouTube feed",
        message: error instanceof Error ? error.message : String(error),
      },
      response,
    );
  }
}
