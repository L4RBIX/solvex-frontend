"use client";

/**
 * Codeforces handle ownership verification (security hotfix).
 *
 * A handle is public data — this is the only path that binds a handle to a
 * SolveX account: the user places a short-lived code in their public CF
 * "Organization" profile field, and the backend confirms it with a live
 * fetch before granting any handle-scoped privilege (PvP anchor rating,
 * gamification merge, weekly report).
 */

import { useState } from "react";
import { AuthUser, HandleClaimStart, V1ApiError, claimHandle, verifyHandleClaim } from "@/lib/v1Api";

const COLORS = {
  bg: "#06100D",
  border: "#12271E",
  text: "#F4F7F6",
  muted: "#8A9A96",
  mint: "#00F5A0",
  cyan: "#00D9F5",
  amber: "#FFAA33",
  red: "#FF4D6D",
};

function inputStyle(): React.CSSProperties {
  return {
    flex: "1 1 160px",
    padding: "8px 10px",
    fontSize: "13px",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "8px",
    color: COLORS.text,
    boxSizing: "border-box",
  };
}

function btn(primary = true, disabled = false): React.CSSProperties {
  return {
    padding: "8px 14px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: "8px",
    border: primary ? `1px solid ${COLORS.mint}` : `1px solid ${COLORS.border}`,
    background: primary ? "rgba(0,245,160,0.1)" : "transparent",
    color: primary ? COLORS.mint : COLORS.muted,
    opacity: disabled ? 0.5 : 1,
  };
}

interface HandleClaimPanelProps {
  user: AuthUser;
  onVerified: (handle: string) => void;
}

export default function HandleClaimPanel({ user, onVerified }: HandleClaimPanelProps) {
  const [handleInput, setHandleInput] = useState("");
  const [claim, setClaim] = useState<HandleClaimStart | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [verifiedHandle, setVerifiedHandle] = useState<string | null>(null);

  const activeVerifiedHandle = verifiedHandle ?? (user.handle_verified ? user.handle : null);
  if (activeVerifiedHandle) {
    return (
      <div style={{ fontSize: "12px", color: COLORS.mint, display: "flex", alignItems: "center", gap: "6px" }}>
        ✓ Verified as <strong>{activeVerifiedHandle}</strong>
      </div>
    );
  }

  const onStartClaim = async () => {
    setError(null);
    if (!handleInput.trim()) {
      setError("Enter your Codeforces handle.");
      return;
    }
    setBusy(true);
    try {
      const result = await claimHandle(handleInput.trim());
      if (result.already_verified) {
        setVerifiedHandle(result.handle);
        onVerified(result.handle);
      } else if (!result.claim_id || !result.verification_code) {
        setError("The server did not return a verification code. Start a new claim and try again.");
      } else {
        setClaim(result);
      }
    } catch (e) {
      setError(e instanceof V1ApiError ? e.message : "Could not start verification.");
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async () => {
    if (!claim?.claim_id) return;
    setError(null);
    setBusy(true);
    try {
      const result = await verifyHandleClaim(claim.claim_id);
      setVerifiedHandle(result.handle);
      setClaim(null);
      onVerified(result.handle);
    } catch (e) {
      setError(e instanceof V1ApiError ? e.message : "Verification failed — check the code and try again.");
    } finally {
      setBusy(false);
    }
  };

  const verificationField = claim?.verification_field || "organization";
  const instructions = claim?.instructions || (
    `Open Codeforces Settings, set the public “Organization” field to the exact code below, save, then verify here. ` +
    `You can restore the field after verification.`
  );
  const expiresAt = claim?.expires_at ? new Date(claim.expires_at) : null;
  const expiryLabel = expiresAt && !Number.isNaN(expiresAt.getTime())
    ? expiresAt.toLocaleTimeString()
    : null;

  const onCopy = async () => {
    if (!claim?.verification_code) return;
    try {
      await navigator.clipboard.writeText(claim.verification_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — code stays visible as text */
    }
  };

  return (
    <div
      style={{
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "12px",
        padding: "16px",
      }}
    >
      <div style={{ fontSize: "11px", fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
        Verify your Codeforces handle
      </div>

      {!claim ? (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            style={inputStyle()}
            value={handleInput}
            onChange={(e) => setHandleInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onStartClaim()}
            placeholder="Your Codeforces handle"
          />
          <button type="button" style={btn(true, busy)} onClick={onStartClaim} disabled={busy}>
            {busy ? "…" : "Start verification"}
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "8px" }}>
          <p style={{ fontSize: "12px", color: COLORS.muted, margin: 0, lineHeight: "17px" }}>
            {instructions}
          </p>
          <p style={{ fontSize: "11px", color: COLORS.muted, margin: 0 }}>
            SolveX checks the current public Codeforces <strong style={{ color: COLORS.text }}>{verificationField}</strong> field with a live, uncached profile request.
          </p>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <code
              style={{
                fontSize: "12px",
                color: COLORS.cyan,
                background: "rgba(0,217,245,0.06)",
                border: `1px solid rgba(0,217,245,0.2)`,
                borderRadius: "6px",
                padding: "6px 10px",
                wordBreak: "break-all",
              }}
            >
              {claim.verification_code}
            </code>
            <button type="button" style={btn(false)} onClick={onCopy}>
              {copied ? "Copied!" : "Copy code"}
            </button>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button type="button" style={btn(true, busy)} onClick={onVerify} disabled={busy}>
              {busy ? "Checking…" : "I've set it — Verify now"}
            </button>
            <button type="button" style={btn(false)} onClick={() => setClaim(null)}>
              Use a different handle
            </button>
          </div>
          <p style={{ fontSize: "10.5px", color: COLORS.amber, margin: 0 }}>
            {expiryLabel ? `Expires ${expiryLabel}` : "This code is short-lived"} — start a new claim if it lapses.
          </p>
        </div>
      )}

      {error && <p style={{ fontSize: "11px", color: COLORS.red, marginTop: "8px" }}>{error}</p>}
    </div>
  );
}
