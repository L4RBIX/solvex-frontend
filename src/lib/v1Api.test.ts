import { beforeEach, describe, expect, it, vi } from "vitest";

const tokens = vi.hoisted(() => ({ current: "token-old", refreshed: "token-new" }));
const getAccessToken = vi.hoisted(() => vi.fn(async () => tokens.current));
const refreshAccessToken = vi.hoisted(() => vi.fn(async () => tokens.refreshed));

vi.mock("@/lib/supabaseClient", () => ({
  getAccessToken,
  getCurrentAccessToken: () => tokens.current,
  refreshAccessToken,
}));

import {
  getGamification,
  getPublicProblem,
} from "@/lib/v1Api";

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

const publicProblem = {
  problem_id: "71A",
  contest_id: 71,
  index: "A",
  name: "Way Too Long Words",
  rating: 800,
  tags: ["strings"],
  official_url: "https://codeforces.com/problemset/problem/71/A",
  content_available: true,
  authored_content: {
    summary: "Shorten long words.",
    input_format: "Read n and n words.",
    output_format: "Print each transformed word.",
    constraints: "1 <= n <= 100.",
    samples: [{ input: "1\nlocalization\n", output: "l10n\n", note: null }],
  },
};

describe("public problem API", () => {
  beforeEach(() => {
    getAccessToken.mockClear();
  });

  it("normalizes the ID, validates the payload, and sends no bearer token", async () => {
    const fetchMock = vi.fn<FetchFn>(async () =>
      new Response(JSON.stringify(publicProblem), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPublicProblem(" 71a ")).resolves.toEqual(publicProblem);
    expect(fetchMock.mock.calls[0][0].toString()).toContain(
      "/api/v1/problems/71A"
    );
    expect(
      new Headers(fetchMock.mock.calls[0][1]?.headers).has("Authorization")
    ).toBe(false);
    expect(getAccessToken).not.toHaveBeenCalled();
  });

  it("rejects malformed IDs before making a request", async () => {
    const fetchMock = vi.fn<FetchFn>();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPublicProblem("../../etc/passwd")).rejects.toMatchObject({
      status: 400,
      errorCode: "INVALID_PROBLEM_ID",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves not-found errors from the backend", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<FetchFn>(async () =>
        new Response(
          JSON.stringify({
            error_code: "PROBLEM_NOT_FOUND",
            message: "Problem not found.",
          }),
          { status: 404 }
        )
      )
    );

    await expect(getPublicProblem("9999Z")).rejects.toMatchObject({
      status: 404,
      errorCode: "PROBLEM_NOT_FOUND",
    });
  });

  it("distinguishes invalid payloads from network failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<FetchFn>(async () =>
        new Response(JSON.stringify({ ...publicProblem, tags: "strings" }), {
          status: 200,
        })
      )
    );
    await expect(getPublicProblem("71A")).rejects.toMatchObject({
      errorCode: "INVALID_RESPONSE",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn<FetchFn>(async () => {
        throw new TypeError("offline");
      })
    );
    await expect(getPublicProblem("71A")).rejects.toMatchObject({
      status: 0,
      errorCode: "NETWORK_ERROR",
    });
  });
});
