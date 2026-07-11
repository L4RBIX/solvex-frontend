import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: {} as Record<string, unknown>,
  getGamification: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => mocks.auth }));
vi.mock("@/lib/v1Api", () => ({
  V1ApiError: class V1ApiError extends Error {},
  getApiToken: () => "current-token",
  getGamification: mocks.getGamification,
}));
vi.mock("@/components/auth/HandleClaimPanel", () => ({
  default: () => <div>Connect your Codeforces account to unlock personalized analysis, PvP, and progress tracking.</div>,
}));

import { GamificationWidget } from "@/components/analyze/GamificationWidget";

describe("GamificationWidget auth boundaries", () => {
  beforeEach(() => {
    mocks.getGamification.mockReset();
  });

  it("keeps public analysis available while signed out and does not request private data", async () => {
    mocks.auth = { status: "signed_out", user: null, busy: false, error: null, signIn: vi.fn() };
    render(<GamificationWidget handle="tourist" />);
    expect(screen.getByText(/The analysis for tourist is public/)).toBeInTheDocument();
    await waitFor(() => expect(mocks.getGamification).not.toHaveBeenCalled());
  });

  it("shows the handle connection flow for a signed-in account without a verified handle", () => {
    mocks.auth = {
      status: "signed_in",
      user: { user_id: "internal", role: "user", handle: null, handle_verified: false },
      refresh: vi.fn(),
    };
    mocks.getGamification.mockReturnValue(new Promise(() => undefined));
    render(<GamificationWidget handle="tourist" />);
    expect(screen.getByText(/Connect your Codeforces account/)).toBeInTheDocument();
    expect(screen.getByText(/signed-in, unverified SolveX account/)).toBeInTheDocument();
  });
});
