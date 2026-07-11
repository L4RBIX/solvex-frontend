import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const session = { access_token: "jwt-a", refresh_token: "refresh-a", user: { id: "external" } };
  const auth = {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signInWithOAuth: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn(),
  };
  return { session, auth, getAuthMe: vi.fn(), recovery: { active: false } };
});

vi.mock("@/lib/supabaseClient", () => ({
  getSupabaseClient: () => ({ auth: mocks.auth }),
  setCurrentAccessToken: vi.fn(),
  authRedirectUrl: (path: string) => `http://localhost${path}`,
  safeNextPath: (value?: string | null) => value?.startsWith("/") && !value.startsWith("//") ? value : "/analyze",
  markPasswordRecovery: (active: boolean) => { mocks.recovery.active = active; },
  hasPasswordRecoveryMarker: () => mocks.recovery.active,
}));

vi.mock("@/lib/v1Api", () => ({
  getAuthMe: mocks.getAuthMe,
  V1ApiError: class V1ApiError extends Error {},
}));

import { AuthProvider } from "@/components/auth/AuthProvider";
import { useAuth } from "@/hooks/useAuth";

function Probe() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="status">{auth.status}</span>
      <span data-testid="handle">{auth.user?.handle ?? "none"}</span>
      <button onClick={() => void auth.signInWithPassword("a@example.com", "password1").catch(() => undefined)}>email-sign-in</button>
      <button onClick={() => void auth.signUpWithPassword("a@example.com", "password1")}>email-sign-up</button>
      <button onClick={() => void auth.signInWithGoogle("/duels")}>google</button>
      <button onClick={() => void auth.requestPasswordReset("unknown@example.com")}>forgot</button>
      <button onClick={() => void auth.signOut()}>sign-out</button>
    </div>
  );
}

function renderProvider() {
  return render(<AuthProvider><Probe /></AuthProvider>);
}

describe("AuthProvider", () => {
  beforeEach(() => {
    mocks.recovery.active = false;
    mocks.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mocks.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    mocks.auth.signInWithPassword.mockResolvedValue({ data: { session: mocks.session }, error: null });
    mocks.auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    mocks.auth.signInWithOAuth.mockResolvedValue({ error: null });
    mocks.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    mocks.auth.signOut.mockResolvedValue({ error: null });
    mocks.getAuthMe.mockResolvedValue({ user_id: "internal", role: "user", handle: null, handle_verified: false });
  });

  it("restores a persisted session and linked handle after reload", async () => {
    mocks.auth.getSession.mockResolvedValue({ data: { session: mocks.session }, error: null });
    mocks.getAuthMe.mockResolvedValue({ user_id: "internal", role: "user", handle: "tourist", handle_verified: true });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("signed_in"));
    expect(screen.getByTestId("handle")).toHaveTextContent("tourist");
  });

  it("signs in with email and synchronizes the backend account", async () => {
    renderProvider();
    fireEvent.click(screen.getByText("email-sign-in"));
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("signed_in"));
    expect(mocks.auth.signInWithPassword).toHaveBeenCalledWith({ email: "a@example.com", password: "password1" });
  });

  it("shows a signed-out state after sign-in failure", async () => {
    mocks.auth.signInWithPassword.mockResolvedValue({ data: { session: null }, error: new Error("Invalid credentials") });
    renderProvider();
    fireEvent.click(screen.getByText("email-sign-in"));
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("signed_out"));
  });

  it("starts email sign-up with a confirmation callback", async () => {
    renderProvider();
    fireEvent.click(screen.getByText("email-sign-up"));
    await waitFor(() => expect(mocks.auth.signUp).toHaveBeenCalledTimes(1));
    expect(mocks.auth.signUp.mock.calls[0][0].options.emailRedirectTo).toContain("/auth/callback?next=/analyze");
  });

  it("starts Google OAuth with an allowlisted callback", async () => {
    renderProvider();
    fireEvent.click(screen.getByText("google"));
    await waitFor(() => expect(mocks.auth.signInWithOAuth).toHaveBeenCalledTimes(1));
    expect(mocks.auth.signInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({ provider: "google" }));
    expect(mocks.auth.signInWithOAuth.mock.calls[0][0].options.redirectTo).toContain(encodeURIComponent("/duels"));
  });

  it("sign-out immediately clears private account state", async () => {
    mocks.auth.getSession.mockResolvedValue({ data: { session: mocks.session }, error: null });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("signed_in"));
    fireEvent.click(screen.getByText("sign-out"));
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("signed_out"));
    expect(screen.getByTestId("handle")).toHaveTextContent("none");
  });

  it("requests password reset without depending on account existence", async () => {
    renderProvider();
    fireEvent.click(screen.getByText("forgot"));
    await waitFor(() => expect(mocks.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "unknown@example.com",
      expect.objectContaining({ redirectTo: expect.stringContaining("/auth/callback") })
    ));
  });
});
