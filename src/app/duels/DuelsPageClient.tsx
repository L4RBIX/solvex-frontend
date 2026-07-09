"use client";

/**
 * Friend 1v1 duels hub (Phase G4 → G4.1). Invite-link only — no matchmaking.
 *
 * Create or join here; the live experience happens in /duels/[duelId]
 * (waiting room, ready, countdown) and /arena?duel=<id> (the battle).
 * Failures here never break /analyze or /arena.
 */

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DuelInvitePreview,
  DuelMode,
  DuelSummary,
  V1ApiError,
  createDuel,
  joinDuel,
  listDuels,
  previewDuelInvite,
} from "@/lib/v1Api";

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

function cardStyle(): React.CSSProperties {
  return {
    background: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "12px",
    padding: "16px",
  };
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: "8px 10px",
    fontSize: "13px",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "8px",
    color: COLORS.text,
    boxSizing: "border-box",
  };
}

function btn(primary = true): React.CSSProperties {
  return {
    padding: "8px 14px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    borderRadius: "8px",
    border: primary ? `1px solid ${COLORS.mint}` : `1px solid ${COLORS.border}`,
    background: primary ? "rgba(0,245,160,0.1)" : "transparent",
    color: primary ? COLORS.mint : COLORS.muted,
  };
}

function statusLabel(status: string): string {
  switch (status) {
    case "waiting":
      return "Waiting for opponent";
    case "active":
      return "Live now";
    case "completed":
      return "Completed";
    case "expired":
      return "Expired (draw)";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function modeLabel(mode: string): string {
  return mode === "classic_30" ? "Classic · 30 min" : "Rapid · 10 min";
}

function inviteStorageKey(duelId: string): string {
  return `sx_duel_invite_${duelId}`;
}

function DuelsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handle = (searchParams.get("handle") || "").trim();
  const inviteParam = (searchParams.get("invite") || "").trim();

  const [handleInput, setHandleInput] = useState(handle);
  const [displayName, setDisplayName] = useState(handle || "Player");
  const [mode, setMode] = useState<DuelMode>("rapid_10");
  const [inviteCode, setInviteCode] = useState("");
  const [list, setList] = useState<DuelSummary[]>([]);
  const [preview, setPreview] = useState<DuelInvitePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Adjust derived state during render (React-recommended; avoids effect churn).
  const [prevHandle, setPrevHandle] = useState(handle);
  if (prevHandle !== handle) {
    setPrevHandle(handle);
    setHandleInput(handle);
    setDisplayName(handle || "Player");
  }
  const [prevInvite, setPrevInvite] = useState(inviteParam);
  if (prevInvite !== inviteParam) {
    setPrevInvite(inviteParam);
    setPreview(null);
    setPreviewError(null);
  }

  useEffect(() => {
    if (!handle) return;
    let cancelled = false;
    listDuels(handle)
      .then((res) => {
        if (!cancelled) setList(res.duels);
      })
      .catch(() => {
        // Isolated — list failure must not crash the page.
      });
    return () => {
      cancelled = true;
    };
  }, [handle]);

  // Invite link (?invite=<code>) → safe preview card with a Join button.
  useEffect(() => {
    if (!inviteParam) return;
    let cancelled = false;
    previewDuelInvite(inviteParam)
      .then((p) => {
        if (!cancelled) setPreview(p);
      })
      .catch((e) => {
        if (!cancelled)
          setPreviewError(
            e instanceof V1ApiError && (e.status === 404 || e.status === 410)
              ? "This invite is invalid or no longer joinable."
              : "Could not load the invite. Try again."
          );
      });
    return () => {
      cancelled = true;
    };
  }, [inviteParam]);

  const applyHandle = () => {
    const next = handleInput.trim();
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("handle", next);
    else params.delete("handle");
    router.replace(`/duels?${params.toString()}`);
  };

  const goToRoom = useCallback(
    (duelId: string, invite?: string) => {
      const params = new URLSearchParams();
      if (handle) params.set("handle", handle);
      if (invite) params.set("invite", invite);
      router.push(`/duels/${encodeURIComponent(duelId)}?${params.toString()}`);
    },
    [handle, router]
  );

  const onCreate = async () => {
    setErr(null);
    if (!handle) {
      setErr("Set your Codeforces handle first.");
      return;
    }
    setBusy(true);
    try {
      const created = await createDuel(mode, displayName.trim() || handle, handle);
      try {
        window.sessionStorage.setItem(inviteStorageKey(created.duel_id), created.invite_code);
      } catch {
        /* sessionStorage unavailable — the room falls back to the query param */
      }
      goToRoom(created.duel_id, created.invite_code);
    } catch (e) {
      setErr(e instanceof V1ApiError ? e.message : "Could not create duel.");
      setBusy(false);
    }
  };

  const onJoin = async (code: string) => {
    setErr(null);
    if (!handle) {
      setErr("Set your Codeforces handle first.");
      return;
    }
    if (!code.trim()) {
      setErr("Enter an invite code.");
      return;
    }
    setBusy(true);
    try {
      const joined = await joinDuel(code.trim(), displayName.trim() || handle, handle);
      goToRoom(joined.duel_id);
    } catch (e) {
      const message = e instanceof V1ApiError ? e.message : "Could not join.";
      setErr(message.toLowerCase().includes("invite") ? "Invite code is invalid or expired." : message);
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#020806", color: COLORS.text, padding: "24px 16px 48px" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Friend duel · Invite-only
            </div>
            <h1 style={{ margin: "4px 0 0", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em" }}>
              1v1 Duels
            </h1>
          </div>
          <Link href={handle ? `/analyze?handle=${encodeURIComponent(handle)}` : "/analyze"} style={{ fontSize: "12px", color: COLORS.cyan, textDecoration: "none" }}>
            ← Back to Analyze
          </Link>
        </div>

        {/* Handle */}
        {!handle ? (
          <div style={{ ...cardStyle(), marginBottom: "14px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: COLORS.amber, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Who are you?
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <input
                style={{ ...inputStyle(), flex: "1 1 180px" }}
                value={handleInput}
                onChange={(e) => setHandleInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyHandle()}
                placeholder="Your Codeforces handle, e.g. dan1c"
              />
              <button type="button" style={btn(true)} onClick={applyHandle}>
                Continue
              </button>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: "12px", color: COLORS.muted, marginTop: 0 }}>
            Playing as <strong style={{ color: COLORS.text }}>{handle}</strong>{" "}
            <Link href="/duels" style={{ color: COLORS.cyan, fontSize: "11px" }}>
              (change)
            </Link>
          </p>
        )}

        {/* Invite preview (from a shared link) */}
        {inviteParam && (
          <div style={{ ...cardStyle(), marginBottom: "14px", borderColor: "rgba(0,245,160,0.4)" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: COLORS.mint, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              You&apos;ve been challenged!
            </div>
            {preview ? (
              <>
                <div style={{ fontSize: "15px", fontWeight: 700 }}>
                  {preview.creator_display_name} invites you to a duel
                </div>
                <div style={{ fontSize: "12px", color: COLORS.muted, marginTop: "6px" }}>
                  {modeLabel(preview.mode)}
                  {preview.problem?.rating != null && ` · problem rated ${preview.problem.rating}`}
                  {preview.problem?.tags?.length ? ` · ${preview.problem.tags.slice(0, 3).join(", ")}` : ""}
                </div>
                <div style={{ marginTop: "12px" }}>
                  <button type="button" style={btn(true)} onClick={() => onJoin(inviteParam)} disabled={busy || !handle}>
                    {busy ? "Joining…" : "Accept & join duel"}
                  </button>
                  {!handle && (
                    <span style={{ fontSize: "11px", color: COLORS.amber, marginLeft: "10px" }}>
                      Set your handle above first.
                    </span>
                  )}
                </div>
              </>
            ) : previewError ? (
              <p style={{ fontSize: "13px", color: COLORS.red, margin: 0 }}>{previewError}</p>
            ) : (
              <p style={{ fontSize: "13px", color: COLORS.muted, margin: 0 }}>Loading invite…</p>
            )}
          </div>
        )}

        <div style={{ display: "grid", gap: "12px", marginBottom: "16px" }}>
          <div style={cardStyle()}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: COLORS.muted, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Create duel
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              <input style={inputStyle()} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" />
              <select
                style={inputStyle()}
                value={mode}
                onChange={(e) => setMode(e.target.value as DuelMode)}
                aria-label="Duel mode"
              >
                <option value="rapid_10">Rapid — 10 minutes</option>
                <option value="classic_30">Classic — 30 minutes</option>
              </select>
              <button type="button" style={btn(true)} onClick={onCreate} disabled={!handle || busy}>
                {busy ? "Creating…" : "Create duel & get invite link"}
              </button>
            </div>
            <p style={{ fontSize: "11px", color: COLORS.muted, margin: "10px 0 0" }}>
              You&apos;ll get an invite link for a friend. Same problem for both — first accepted wins;
              fewer hints breaks ties.
            </p>
          </div>

          <div style={cardStyle()}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: COLORS.muted, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Join with invite code
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <input
                style={{ ...inputStyle(), flex: "1 1 180px" }}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Invite code"
              />
              <button type="button" style={btn(false)} onClick={() => onJoin(inviteCode)} disabled={!handle || busy}>
                Join
              </button>
            </div>
          </div>
        </div>

        {err && <p style={{ fontSize: "12px", color: COLORS.red, marginTop: 0 }}>{err}</p>}

        {list.length > 0 && (
          <div style={{ ...cardStyle(), marginBottom: "16px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: COLORS.muted, marginBottom: "8px", textTransform: "uppercase" }}>
              Your duels
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
              {list.slice(0, 10).map((d) => (
                <li key={d.duel_id}>
                  <button
                    type="button"
                    onClick={() => goToRoom(d.duel_id)}
                    style={{
                      ...btn(d.status === "active" || d.status === "waiting"),
                      width: "100%",
                      textAlign: "left",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <span>
                      {modeLabel(d.mode)} · {d.problem_id}
                      {d.problem_rating != null ? ` (${d.problem_rating})` : ""}
                    </span>
                    <span style={{ color: d.status === "active" ? COLORS.mint : COLORS.muted }}>
                      {statusLabel(d.status)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DuelsPageClient() {
  return (
    <Suspense fallback={<div style={{ background: "#020806", color: "#8A9A96", padding: "40px", textAlign: "center" }}>Loading duels…</div>}>
      <DuelsContent />
    </Suspense>
  );
}
