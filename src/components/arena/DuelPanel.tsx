"use client";

/**
 * Duel-mode UI for the Arena (Phase G4.1): live status bar + result overlay.
 * Rendered only when /arena?duel=<id> — normal Arena is untouched.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Lightbulb, Swords } from "lucide-react";
import type { DuelHintResponse, DuelParticipantState, DuelState } from "@/lib/v1Api";

const MINT = "#00F5A0";
const CYAN = "#00D9F5";
const AMBER = "#FFAA33";
const RED = "#FF4D6D";
const MUTED = "#8A9A96";

// "Accepted" is reserved for authoritative (official Codeforces) judging,
// which SolveX never has for CF catalog problems — always say "Custom tests
// passed" here instead, per the honest-verdict policy.
function opponentStatusLabel(p: DuelParticipantState, duelStatus: string): { text: string; color: string } {
  if (p.is_winner) return { text: "Won", color: MINT };
  if (duelStatus === "completed" || duelStatus === "expired") {
    if (p.accepted) return { text: "Custom tests passed", color: MINT };
    return { text: duelStatus === "expired" ? "Draw" : "Lost", color: MUTED };
  }
  if (p.accepted) return { text: "Custom tests passed ✓", color: MINT };
  if (p.judging) return { text: "Judging…", color: CYAN };
  if (p.wrong_attempts > 0) return { text: `Failed attempt ×${p.wrong_attempts}`, color: AMBER };
  if (p.arena_opened) return { text: "Coding", color: CYAN };
  if (p.ready) return { text: "Ready", color: MINT };
  return { text: "Joined", color: MUTED };
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

// ─── Status bar ───────────────────────────────────────────────────────────────

interface DuelStatusBarProps {
  state: DuelState;
  hints: DuelHintResponse[];
  onUseHint: () => void;
  hintLoading: boolean;
  hintError: string | null;
}

export function DuelStatusBar({ state, hints, onUseHint, hintLoading, hintError }: DuelStatusBarProps) {
  // Server-aligned clock: offset recomputed each poll, ticking locally.
  const [now, setNow] = useState(0);
  const [showHints, setShowHints] = useState(false);

  const running = state.status === "active";
  useEffect(() => {
    if (!running) return;
    const server = Date.parse(state.server_time);
    const offset = Number.isNaN(server) ? 0 : server - Date.now();
    const tick = () => setNow(Date.now() + offset);
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [running, state.server_time]);

  const me = state.participants.find((p) => p.is_viewer);
  const opponent = state.participants.find((p) => !p.is_viewer);

  const clockReady = now > 0;
  const startsAtMs = state.starts_at ? Date.parse(state.starts_at) : NaN;
  const expiresAtMs = Date.parse(state.expires_at);
  const countdownLeft = clockReady && !Number.isNaN(startsAtMs) ? Math.ceil((startsAtMs - now) / 1000) : 0;
  const timeLeft = clockReady && !Number.isNaN(expiresAtMs) ? (expiresAtMs - now) / 1000 : 0;

  const myStatus = me ? opponentStatusLabel(me, state.status) : null;
  const oppStatus = opponent ? opponentStatusLabel(opponent, state.status) : null;
  const hintsLeft = Math.max(0, state.hints_max - (me?.hint_count ?? 0));

  return (
    <div
      style={{
        borderBottom: "1px solid rgba(0,217,245,0.2)",
        background: "rgba(0,217,245,0.05)",
        padding: "6px 16px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        flexWrap: "wrap",
        fontSize: "12px",
        flexShrink: 0,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "6px", color: CYAN, fontWeight: 700 }}>
        <Swords size={13} />
        Duel · {state.mode === "classic_30" ? "Classic 30" : "Rapid 10"}
      </span>

      <span
        title={state.judging_note}
        style={{
          padding: "2px 8px",
          borderRadius: "10px",
          fontSize: "10px",
          fontWeight: 700,
          color: AMBER,
          background: "rgba(255,170,51,0.08)",
          border: `1px solid rgba(255,170,51,0.3)`,
        }}
      >
        Practice judging — not official Codeforces tests
      </span>

      {running && !clockReady ? (
        <span style={{ color: MUTED, fontWeight: 600 }}>⏱ …</span>
      ) : running && countdownLeft > 0 ? (
        <span style={{ color: MINT, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
          Starting in {countdownLeft}…
        </span>
      ) : running ? (
        <span
          style={{
            color: timeLeft < 60 ? RED : "#F4F7F6",
            fontWeight: 700,
            fontFamily: "ui-monospace, monospace",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ⏱ {formatClock(timeLeft)}
        </span>
      ) : (
        <span style={{ color: MUTED, fontWeight: 600 }}>
          {state.status === "waiting" ? "Waiting room" : state.status}
        </span>
      )}

      {me && myStatus && (
        <span style={{ color: MUTED }}>
          You: <span style={{ color: myStatus.color, fontWeight: 600 }}>{myStatus.text}</span>
          {me.wrong_attempts > 0 && !me.accepted ? "" : ""}
        </span>
      )}
      {opponent && oppStatus ? (
        <span style={{ color: MUTED }}>
          {opponent.display_name}:{" "}
          <span style={{ color: oppStatus.color, fontWeight: 600 }}>{oppStatus.text}</span>
          {opponent.hint_count > 0 && (
            <span style={{ color: AMBER }}> · {opponent.hint_count} hint{opponent.hint_count > 1 ? "s" : ""}</span>
          )}
        </span>
      ) : (
        <span style={{ color: AMBER }}>Waiting for opponent…</span>
      )}

      <span style={{ flex: 1 }} />

      <span style={{ color: MUTED }} title="Hints help, but fewer hints wins ties.">
        Hints used: <span style={{ color: (me?.hint_count ?? 0) > 0 ? AMBER : "#F4F7F6", fontWeight: 700 }}>{me?.hint_count ?? 0}</span>/{state.hints_max}
      </span>

      <button
        type="button"
        onClick={() => {
          if (!showHints && hints.length > 0) {
            setShowHints(true);
            return;
          }
          setShowHints(true);
          onUseHint();
        }}
        disabled={state.status !== "active" || hintLoading || countdownLeft > 0}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          padding: "4px 10px",
          borderRadius: "6px",
          border: `1px solid ${AMBER}`,
          background: "rgba(255,170,51,0.08)",
          color: AMBER,
          fontSize: "11px",
          fontWeight: 700,
          cursor: state.status === "active" && !hintLoading ? "pointer" : "not-allowed",
          opacity: state.status === "active" ? 1 : 0.4,
        }}
        title="Hints help, but fewer hints wins ties."
      >
        <Lightbulb size={12} />
        {hintLoading ? "…" : hintsLeft > 0 ? `Use Hint (${hintsLeft} left)` : "Hints"}
      </button>

      {(showHints && (hints.length > 0 || hintError)) && (
        <div style={{ flexBasis: "100%", display: "flex", flexDirection: "column", gap: "4px", paddingBottom: "4px" }}>
          {hints.map((h) => (
            <div key={h.hint_number} style={{ fontSize: "11px", color: "#D9E2DF", background: "rgba(255,170,51,0.06)", border: "1px solid rgba(255,170,51,0.25)", borderRadius: "6px", padding: "6px 10px" }}>
              <strong style={{ color: AMBER }}>Hint {h.hint_number}:</strong> {h.hint_text}
            </div>
          ))}
          {hintError && <div style={{ fontSize: "11px", color: RED }}>{hintError}</div>}
          <div style={{ fontSize: "10px", color: MUTED }}>
            Hints help, but fewer hints wins ties. · {state.judging_note}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Result overlay ───────────────────────────────────────────────────────────

const CONFETTI_COLORS = ["#00F5A0", "#00D9F5", "#FFAA33", "#FF4D6D", "#F4F7F6"];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        left: (i * 137.5) % 100,
        delay: (i % 12) * 0.12,
        duration: 2.2 + (i % 5) * 0.35,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + (i % 3) * 3,
        rotate: (i * 47) % 360,
      })),
    []
  );
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: "-12px",
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 0.45}px`,
            background: p.color,
            borderRadius: "2px",
            transform: `rotate(${p.rotate}deg)`,
            animation: `sx-confetti-fall ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes sx-confetti-fall {
          0%   { transform: translateY(-12px) rotate(0deg); opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(105vh) rotate(540deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

interface DuelResultOverlayProps {
  state: DuelState;
  handle: string;
  onDismiss: () => void;
}

export function DuelResultOverlay({ state, handle, onDismiss }: DuelResultOverlayProps) {
  const result = state.result;
  if (!result) return null;
  const me = state.participants.find((p) => p.is_viewer);
  const opponent = state.participants.find((p) => !p.is_viewer);

  // Practice-duel copy: judging is a shared custom test, not official
  // Codeforces verification — never imply the loser's solution is wrong
  // unless a verified failing test says so.
  const heading = result.viewer_won ? "You won the practice duel" : result.is_draw ? "Draw" : "You lost";
  const headingColor = result.viewer_won ? MINT : result.is_draw ? MUTED : RED;
  const sub = result.viewer_won
    ? "First to pass the shared custom tests. Well played!"
    : result.is_draw
      ? "Neither side passed the shared test in time — rematch?"
      : result.result_reason === "fewer_hints"
        ? `${result.winner_display_name ?? "Opponent"} passed the shared tests with fewer hints.`
        : `Opponent passed the shared tests first.`;

  const statRow = (label: string, a: string | number, b: string | number) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "12px", padding: "5px 0", borderTop: "1px solid #12271E" }}>
      <span style={{ color: MUTED }}>{label}</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>
        <span style={{ color: "#F4F7F6", fontWeight: 600 }}>{a}</span>
        <span style={{ color: MUTED }}> vs </span>
        <span style={{ color: "#F4F7F6", fontWeight: 600 }}>{b}</span>
      </span>
    </div>
  );

  const fmtAccept = (p?: DuelParticipantState | null) =>
    p?.seconds_to_accept != null ? formatClock(p.seconds_to_accept) : "—";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(2,8,6,0.88)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      {result.viewer_won && <Confetti />}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "420px",
          background: "#06100D",
          border: `1px solid ${result.viewer_won ? "rgba(0,245,160,0.5)" : "#12271E"}`,
          borderRadius: "14px",
          padding: "24px",
          textAlign: "center",
          animation: "sx-result-pop 0.35s cubic-bezier(0.2, 1.4, 0.4, 1)",
        }}
      >
        <div style={{ fontSize: "30px", fontWeight: 900, color: headingColor, letterSpacing: "-0.02em" }}>
          {heading}
        </div>
        <div style={{ fontSize: "13px", color: MUTED, marginTop: "6px" }}>{sub}</div>
        {result.xp_awarded > 0 && (
          <div style={{ fontSize: "12px", color: MINT, marginTop: "8px", fontWeight: 700 }}>
            +{result.xp_awarded} XP
          </div>
        )}

        {me && opponent && (
          <div style={{ marginTop: "16px", textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em", paddingBottom: "6px" }}>
              <span>You</span>
              <span>{opponent.display_name}</span>
            </div>
            {statRow("Time to accepted", fmtAccept(me), fmtAccept(opponent))}
            {statRow("Hints used", me.hint_count, opponent.hint_count)}
            {statRow("Wrong attempts", me.wrong_attempts, opponent.wrong_attempts)}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "20px", flexWrap: "wrap" }}>
          <Link
            href={handle ? `/duels?handle=${encodeURIComponent(handle)}` : "/duels"}
            style={{
              padding: "9px 16px",
              borderRadius: "8px",
              border: `1px solid ${MINT}`,
              background: "rgba(0,245,160,0.1)",
              color: MINT,
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Back to Duels
          </Link>
          <button
            type="button"
            onClick={onDismiss}
            style={{
              padding: "9px 16px",
              borderRadius: "8px",
              border: "1px solid #12271E",
              background: "transparent",
              color: MUTED,
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Stay in Arena
          </button>
        </div>
        <style>{`
          @keyframes sx-result-pop {
            0% { transform: scale(0.85); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
