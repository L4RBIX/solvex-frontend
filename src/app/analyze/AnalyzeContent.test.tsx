import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AnalysisResult } from "@/lib/cfAnalysis";

const mocks = vi.hoisted(() => ({
  fetchLegacyAnalysis: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("handle=tourist"),
}));

vi.mock("@/lib/v1Api", () => ({
  V1ApiError: class V1ApiError extends Error {
    status?: number;
    errorCode?: string;
    isRateLimited?: boolean;
  },
  fetchLegacyAnalysis: mocks.fetchLegacyAnalysis,
}));

// These subcomponents make their own auth/network calls and are covered by
// their own test files; stub them so this suite stays focused on the
// friction-card / retry-queue / comfort-zone clarity changes.
vi.mock("@/components/analyze/V1TrainingPanel", () => ({ V1TrainingPanel: () => null }));
vi.mock("@/components/analyze/GamificationWidget", () => ({ GamificationWidget: () => null }));
vi.mock("@/components/analyze/PrivateLeaderboardSection", () => ({ PrivateLeaderboardSection: () => null }));
vi.mock("@/components/analyze/PvPCallout", () => ({ PvPCallout: () => null }));

import { AnalyzeContent } from "@/app/analyze/AnalyzeContent";

// Reproduces the exact reported bug: 78% friction intensity next to a
// low-evidence badge (5 attempted problems), 4.4 avg attempts, and a
// generic-looking WA/TLE breakdown.
const mockResult: AnalysisResult = {
  handle: "tourist",
  profile: {
    handle: "tourist",
    rating: 3800,
    maxRating: 4000,
    rank: "legendary grandmaster",
    maxRank: "legendary grandmaster",
    country: "Belarus",
    organization: "",
  },
  summary: {
    totalSubmissions: 500,
    uniqueSolved: 300,
    mainLanguage: "C++",
    avgSolvedRating: 2600,
  },
  diagnosis: "Test diagnosis text.",
  frictionAreas: [
    {
      tag: "shortest paths",
      solved: 5,
      attempted: 5,
      totalSubmissions: 22,
      waCount: 13,
      tleCount: 2,
      reCount: 0,
      avgAttemptsBeforeAC: 4.4,
      solveRate: 1,
      frictionScore: 43.3, // × 1.8 rounds to 78, matching the reported "78%"
      issue: "High wrong-answer rate",
      action: "Practice systematic edge-case testing",
      confidence: "low",
      color: "#00D9F5",
    },
  ],
  strongTopics: [],
  errorBreakdown: {
    wrongAnswer: 60,
    timeLimitExceeded: 20,
    runtimeError: 5,
    compileError: 2,
    memoryLimitExceeded: 1,
    other: 0,
  },
  ratingComfortZone: { min: 1200, max: 1600, sweet: 1400 },
  recommendedProblems: [
    {
      name: "Remilia Plays Soku",
      rating: 1100,
      tags: ["games", "shortest paths"],
      reason: "Solved after 15 attempts — high retry in Shortest Paths",
      contestId: 1868,
      index: "A",
    },
  ],
  sevenDayQueue: [],
};

describe("Analysis dashboard clarity", () => {
  beforeEach(() => {
    mocks.fetchLegacyAnalysis.mockReset();
    mocks.fetchLegacyAnalysis.mockResolvedValue(mockResult);
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("relabels friction stats and adds a plain-language explanation", async () => {
    render(<AnalyzeContent />);
    await screen.findByText("Friction areas");

    expect(screen.getByText("Submissions")).toBeInTheDocument();
    expect(screen.queryByText("Subs", { exact: true })).not.toBeInTheDocument();

    expect(screen.getByText("Avg attempts")).toBeInTheDocument();
    expect(screen.queryByText("Avg tries", { exact: true })).not.toBeInTheDocument();

    // "Solved" alone still legitimately labels the profile-bar stat; only the
    // friction card's own label needed to change to "Solved problems".
    expect(screen.getByText("Solved problems")).toBeInTheDocument();

    expect(screen.getByText("Solved all 5, but needed 4.4 attempts on average.")).toBeInTheDocument();
  });

  it("labels confidence as evidence, not a contradictory severity tag", async () => {
    render(<AnalyzeContent />);
    await screen.findByText("Friction areas");

    // 78% friction intensity with only 5 attempted problems behind it.
    expect(screen.getByText("78%")).toBeInTheDocument();
    expect(screen.getByText("Low evidence")).toBeInTheDocument();
    expect(screen.queryByText("LOW", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("low", { exact: true })).not.toBeInTheDocument();
  });

  it("shows topic-aware recommendation copy instead of the generic default", async () => {
    render(<AnalyzeContent />);
    await screen.findByText("Friction areas");

    expect(screen.getByText("Practice graph distance edge cases")).toBeInTheDocument();
    expect(screen.queryByText("Practice systematic edge-case testing")).not.toBeInTheDocument();
  });

  it("practice CTA is a real button that scrolls to and filters the retry queue", async () => {
    render(<AnalyzeContent />);
    await screen.findByText("Friction areas");

    const cta = screen.getByRole("button", { name: /View recommended problems/i });
    expect(cta.tagName).toBe("BUTTON");
    expect(cta).not.toHaveAttribute("href");

    fireEvent.click(cta);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(await screen.findByText(/Showing problems for:/i)).toBeInTheDocument();
    expect(screen.getByText("Remilia Plays Soku")).toBeInTheDocument();

    const clear = screen.getByRole("button", { name: /Clear topic filter/i });
    fireEvent.click(clear);
    expect(screen.queryByText(/Showing problems for:/i)).not.toBeInTheDocument();
  });

  it("retry queue opens Arena first and keeps Codeforces secondary", async () => {
    render(<AnalyzeContent />);
    await screen.findByText("Problems to revisit");

    const solveLink = screen.getByRole("link", { name: "Solve in Arena" });
    expect(solveLink).toHaveAttribute(
      "href",
      "/arena?problem=1868A&handle=tourist"
    );
    expect(solveLink.getAttribute("href")).not.toContain("codeforces.com");

    const officialLink = screen.getByRole("link", { name: /Codeforces/i });
    expect(officialLink).toHaveAttribute(
      "href",
      "https://codeforces.com/problemset/problem/1868/A"
    );
    expect(officialLink).toHaveAttribute("target", "_blank");
  });

  it("seven-day training queue opens the selected problem in Arena", async () => {
    mocks.fetchLegacyAnalysis.mockResolvedValue({
      ...mockResult,
      sevenDayQueue: [
        {
          day: 1,
          focus: "Shortest Paths",
          problemName: "Remilia Plays Soku",
          contestId: 1868,
          index: "A",
          rating: 1100,
          reason: "High wrong-answer rate",
          tagColor: "#00D9F5",
        },
      ],
    });
    render(<AnalyzeContent />);
    await screen.findByText("Your training queue");

    const queue = screen.getByText("Your training queue").closest("section");
    expect(queue).not.toBeNull();
    const queueView = within(queue as HTMLElement);
    const solveLink = queueView.getByRole("link", { name: "Solve in Arena" });
    const officialLink = queueView.getByRole("link", { name: /Codeforces/i });
    expect(solveLink).toHaveAttribute(
      "href",
      "/arena?problem=1868A&handle=tourist"
    );
    expect(solveLink).toHaveTextContent("Solve in Arena");
    expect(officialLink).toHaveAttribute(
      "href",
      "https://codeforces.com/problemset/problem/1868/A"
    );
    expect(officialLink).toHaveTextContent("Codeforces");
    expect(officialLink).toHaveAttribute("target", "_blank");
  });

  it("rating comfort zone explains itself and shows suggested range in the summary", async () => {
    render(<AnalyzeContent />);
    await screen.findByText("Rating Comfort Zone");

    expect(
      screen.getByText(/best training range is where problems are hard enough to expose mistakes/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Suggested training range")).toBeInTheDocument();
    expect(screen.getByText("1200–1600")).toBeInTheDocument();
    expect(screen.getByText("Highest-friction topic")).toBeInTheDocument();
  });
});
