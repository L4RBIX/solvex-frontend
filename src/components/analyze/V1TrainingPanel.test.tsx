import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  syncHandle: vi.fn(),
  analyzeWeakness: vi.fn(),
  getDailyQueue: vi.fn(),
  getPlan: vi.fn(),
  getMyEntitlements: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    status: "signed_in",
    user: {
      user_id: "user-1",
      handle: "Dan1c",
      handle_verified: true,
    },
    busy: false,
    error: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/v1Api", () => ({
  V1ApiError: class V1ApiError extends Error {
    status = 500;
    errorCode = "ERROR";
    isPremiumGate = false;
  },
  getApiToken: () => "token",
  syncHandle: api.syncHandle,
  analyzeWeakness: api.analyzeWeakness,
  getDailyQueue: api.getDailyQueue,
  getPlan: api.getPlan,
  getMyEntitlements: api.getMyEntitlements,
  getWeeklyReport: vi.fn(),
}));

import { V1TrainingPanel } from "@/components/analyze/V1TrainingPanel";

describe("V1 training problem actions", () => {
  beforeEach(() => {
    api.syncHandle.mockResolvedValue({ job: { status: "success" } });
    api.analyzeWeakness.mockResolvedValue({
      run_id: "run-1",
      handle: "Dan1c",
      global_rating: 1800,
      episode_count: 10,
      data_cutoff_time: null,
      run_warnings: [],
      skills: [],
    });
    api.getDailyQueue.mockResolvedValue({
      run_id: "queue-1",
      queue_date: "2026-07-23",
      recent_struggle: 0,
      warnings: [],
      items: [
        {
          item_id: "daily-1",
          slot: 1,
          mode: "core_repair",
          problem_id: "71A",
          problem_name: "Way Too Long Words",
          problem_rating: 800,
        },
      ],
    });
    api.getPlan.mockResolvedValue({
      plan_id: "plan-1",
      plan_type: "7_day",
      start_date: "2026-07-23",
      days: [
        {
          day_number: 1,
          theme: "strings",
          items: [
            {
              item_id: "plan-item-1",
              slot: 1,
              mode: "review",
              problem_id: "1364B",
              problem_name: "Most socially-distanced subsequence",
              problem_rating: 1300,
            },
          ],
        },
      ],
    });
    api.getMyEntitlements.mockResolvedValue({
      user: null,
      plan: "free",
      features: {},
    });
  });

  it("opens daily and plan problems in Arena with Codeforces secondary", async () => {
    render(<V1TrainingPanel handle="Dan1c" />);
    fireEvent.click(screen.getByRole("button", { name: "Run deep analysis" }));

    await screen.findByText("Today's queue");
    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: "Solve in Arena" })).toHaveLength(2);
    });

    const solveLinks = screen.getAllByRole("link", { name: "Solve in Arena" });
    expect(solveLinks[0]).toHaveAttribute(
      "href",
      "/arena?problem=71A&handle=Dan1c"
    );
    expect(solveLinks[1]).toHaveAttribute(
      "href",
      "/arena?problem=1364B&handle=Dan1c"
    );
    for (const link of solveLinks) {
      expect(link.getAttribute("href")).not.toContain("codeforces.com");
    }

    const officialLinks = screen.getAllByRole("link", { name: /Codeforces/i });
    expect(officialLinks).toHaveLength(2);
    expect(officialLinks[0]).toHaveAttribute(
      "href",
      "https://codeforces.com/problemset/problem/71/A"
    );
  });
});
