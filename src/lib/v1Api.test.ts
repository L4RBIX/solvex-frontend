import { beforeEach, describe, expect, it, vi } from "vitest";

const tokens = vi.hoisted(() => ({ current: "token-old", refreshed: "token-new" }));
const getAccessToken = vi.hoisted(() => vi.fn(async () => tokens.current));
const refreshAccessToken = vi.hoisted(() => vi.fn(async () => tokens.refreshed));

vi.mock("@/lib/supabaseClient", () => ({
  getAccessToken,
  getCurrentAccessToken: () => tokens.current,
  refreshAccessToken,
}));

import { getGamification } from "@/lib/v1Api";

const snapshot = {
  subject: "user:test",
  plan: "free",
  xp_total: 0,
  level: 1,
  level_progress: { current_level_xp: 0, next_level_xp: 100, progress_percent: 0 },
  streak: { current: 0, longest: 0, active_today: false },
  daily_goal: { target: 2, completed: 0, achieved: false },
  badges: [],
  recent_xp_events: [],
};

type FetchFn = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

describe("private API bearer handling", () => {
  beforeEach(() => {
    tokens.current = "token-old";
    tokens.refreshed = "token-new";
    getAccessToken.mockClear();
    refreshAccessToken.mockClear();
  });

  it("attaches the latest access token", async () => {
    tokens.current = "rotated-token";
    const fetchMock = vi.fn<FetchFn>(async () => new Response(JSON.stringify(snapshot), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await getGamification();
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get("Authorization")).toBe("Bearer rotated-token");
  });

  it("refreshes once on 401 and retries with the rotated token", async () => {
    const fetchMock = vi.fn<FetchFn>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error_code: "INVALID_TOKEN" }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(snapshot), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await getGamification();
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(new Headers(fetchMock.mock.calls[1][1]?.headers).get("Authorization")).toBe("Bearer token-new");
  });

  it("never loops when the retried request is also 401", async () => {
    const fetchMock = vi.fn<FetchFn>(async () => new Response(JSON.stringify({ error_code: "INVALID_TOKEN" }), { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(getGamification()).rejects.toMatchObject({ status: 401 });
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
