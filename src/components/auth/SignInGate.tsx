"use client";

/**
 * Login-required gate for PvP / private leaderboard / private gamification
 * (security hotfix). A Codeforces handle is public data — these features now
 * require a real signed-in account, never just a handle typed into a field.
 */

const COLORS = {
  bg: "#06100D",
  border: "#12271E",
  text: "#F4F7F6",
  muted: "#8A9A96",
  mint: "#00F5A0",
  red: "#FF4D6D",
};

interface SignInGateProps {
  onSignIn: () => void;
  busy?: boolean;
  error?: string | null;
  title?: string;
  message?: string;
}

export default function SignInGate({ onSignIn, busy, error, title, message }: SignInGateProps) {
  return (
    <div
      style={{
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "12px",
        padding: "24px 20px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "14px", fontWeight: 700, color: COLORS.text, marginBottom: "6px" }}>
        {title ?? "Sign in required"}
      </div>
      <p style={{ fontSize: "12.5px", color: COLORS.muted, margin: "0 0 16px", lineHeight: "18px" }}>
        {message ?? "Sign in to continue. Codeforces handles are verified separately when ownership matters."}
      </p>
      <button
        type="button"
        onClick={onSignIn}
        disabled={busy}
        style={{
          padding: "9px 20px",
          borderRadius: "8px",
          border: `1px solid ${COLORS.mint}`,
          background: "rgba(0,245,160,0.1)",
          color: COLORS.mint,
          fontSize: "13px",
          fontWeight: 700,
          cursor: busy ? "not-allowed" : "pointer",
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
      {error && <p style={{ fontSize: "11px", color: COLORS.red, marginTop: "10px" }}>{error}</p>}
    </div>
  );
}
