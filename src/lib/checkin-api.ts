export type LookupResponse = {
  found: boolean;
  name?: string;
  alreadyCheckedIn?: boolean;
  error?: string;
};

export type RegisterResponse = {
  registered: boolean;
  alreadyRegistered: boolean;
  name: string;
  alreadyCheckedIn: boolean;
  error?: string;
};

export type SubmitResponse = {
  checkedIn: boolean;
  alreadyCheckedIn: boolean;
  checkedInAt?: string | null;
  error?: string;
};

export type StatsResponse = {
  deployedYes: number;
  deployedNo: number;
  total: number;
  obstacles: string[];
  topThemes?: Array<{
    theme: string;
    count: number;
    example?: string;
  }>;
  error?: string;
};

export type CheckinReportRow = {
  name: string;
  email: string;
  deployedAgent: boolean;
  obstacle: string;
  source: string;
  referredBy: string;
  checkedInAt: string;
};

export type CheckinReportResponse = {
  total: number;
  rows: CheckinReportRow[];
  error?: string;
};

export type CheckinImageJob = {
  jobId: string;
  status: "queued" | "completed" | "failed";
  imageUrl?: string;
  error?: string;
  attendeeName?: string;
};

async function postJson<T>(url: string, payload: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let data: T | null = null;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      throw new Error("Local API is unavailable. Run with `vercel dev` (not `npm run dev`).");
    }
  }

  if (!data) {
    throw new Error("Local API returned an empty response. Run with `vercel dev`.");
  }

  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? "Request failed");
  }

  return data;
}

export async function lookupAttendee(email: string): Promise<LookupResponse> {
  return postJson<LookupResponse>("/api/checkin/lookup", { email });
}

export async function submitCheckin(payload: {
  email: string;
  deployedAgent: boolean;
  obstacle: string;
}): Promise<SubmitResponse> {
  return postJson<SubmitResponse>("/api/checkin/submit", payload);
}

export async function registerWalkIn(payload: {
  firstName: string;
  lastName: string;
  email: string;
  referredBy: string;
}): Promise<RegisterResponse> {
  return postJson<RegisterResponse>("/api/checkin/register", payload);
}

export async function fetchCheckinStats(): Promise<StatsResponse> {
  const response = await fetch("/api/checkin/stats", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const text = await response.text();
  let data: StatsResponse | null = null;
  if (text) {
    try {
      data = JSON.parse(text) as StatsResponse;
    } catch {
      throw new Error("Local API is unavailable. Run with `vercel dev` (not `npm run dev`).");
    }
  }

  if (!data) {
    throw new Error("Local API returned an empty response. Run with `vercel dev`.");
  }

  if (!response.ok) {
    throw new Error(data.error ?? "Unable to load stats");
  }

  return data;
}

export async function fetchCheckinReport(token?: string): Promise<CheckinReportResponse> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (token) {
    headers["x-report-token"] = token;
  }

  const response = await fetch("/api/checkin/report", {
    method: "GET",
    headers,
  });

  const text = await response.text();
  let data: CheckinReportResponse | null = null;
  if (text) {
    try {
      data = JSON.parse(text) as CheckinReportResponse;
    } catch {
      throw new Error("Report API returned invalid JSON.");
    }
  }

  if (!data) {
    throw new Error("Report API returned an empty response.");
  }

  if (!response.ok) {
    throw new Error(data.error ?? "Unable to load report");
  }

  return data;
}

export async function startCheckinImageJob(name: string): Promise<CheckinImageJob> {
  return postJson<CheckinImageJob>("/api/checkin/image-start", { name });
}

export async function fetchCheckinImageJob(jobId: string): Promise<CheckinImageJob> {
  const response = await fetch(`/api/checkin/image-status?jobId=${encodeURIComponent(jobId)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = (await response.json()) as CheckinImageJob & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Unable to load image status");
  }

  return data;
}
