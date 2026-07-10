"use client";

/**
 * Live duel waiting room (Phase G4.1).
 *
 * Both players land here after create/join: they ready up, the duel
 * auto-starts with a 3-2-1 countdown, and both are redirected into
 * /arena?duel=<id> at the same time. State comes from 1.5s polling —
 * failures here never break /analyze or normal /arena.
 */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DuelState, V1ApiError, readyDuel, startDuel } from "@/lib/v1Api";
import { useDuelState } from "@/hooks/useDuelState";
import { useAuth } from "@/hooks/useAuth";
import SignInGate from "@/components/auth/SignInGate";

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

function btn(primary = true, disabled = false): React.CSSProperties {
  return {
    padding: "10px 18px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: "8px",
    border: primary ? `1px solid ${COLORS.mint}` : `1px solid ${COLORS.border}`,
    background: primary ? "rgba(0,245,160,0.12)" : "transparent",
    color: primary ? COLORS.mint : COLORS.muted,
    opacity: disabled ? 0.45 : 1,
  };
}

export function inviteStorageKey(duelId: string): string {
  return `sx_duel_invite_${duelId}`;
}

function arenaHref(state: DuelState): string {
  const params = new URLSearchParams();
  params.set("duel", state.duel_id);
  if (state.problem?.problem_id) params.set("problem", state.problem.problem_id);
  return `/arena?${params.toString()}`;
}

function DuelRoomContent({ duelId }: { duelId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const signedIn = auth.status === "signed_in" && !!auth.user;

  const { state, fatalError, transientError, applyState } = useDuelState(
    signedIn ? duelId : null,
    1500,
    signedIn ? auth.user?.user_id ?? null : null
  );

  const [actionError, setActionError] = useState<string | null>(null);
  const [readying, setReadying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nowMs, setNowMs] = useState(0);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  // Invite code survives only in the creator's browser (backend stores a hash).
  useEffect(() => {
    try {
      const fromQuery = searchParams.get("invite");
      const stored = window.sessionStorage.getItem(inviteStorageKey(duelId));
      if (fromQuery && !stored) window.sessionStorage.setItem(inviteStorageKey(duelId), fromQuery);
      setInviteCode(fromQuery || stored);
    } catch {
      setInviteCode(null);
    }
  }, [duelId, searchParams]);

  // Server-aligned 250ms tick drives the countdown; offset is recomputed each
  // poll so the 3-2-1 stays fair across devices with skewed clocks.
  const active = state?.status === "active";
  const serverTime = state?.server_time;
  useEffect(() => {
    if (!active) return;
    const server = serverTime ? Date.parse(serverTime) : NaN;
    const offset = Number.isNaN(server) ? 0 : server - Date.now();
    const tick = () => setNowMs(Date.now() + offset);
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [active, serverTime]);

  const startsAtMs = state?.starts_at ? Date.parse(state.starts_at) : NaN;
  const countdownLeft =
    active && nowMs > 0 && !Number.isNaN(startsAtMs)
      ? Math.ceil((startsAtMs - nowMs) / 1000)
      : null;

  // Countdown done → both players enter the Arena together.
  useEffect(() => {
    if (state && state.status === "active" && countdownLeft !== null && countdownLeft <= 0) {
      router.push(arenaHref(state));
    }
  }, [state, countdownLeft, router]);

  const me = state?.participants.find((p) => p.is_viewer) ?? null;
  const opponent = state?.participants.find((p) => !p.is_viewer) ?? null;
  const bothReady = Boolean(me?.ready && opponent?.ready);

  const onReady = async () => {
    setActionError(null);
    setReadying(true);
    try {
      applyState(await readyDuel(duelId));
    } catch (e) {
      setActionError(e instanceof V1ApiError ? e.message : "Could not mark ready.");
    } finally {
      setReadying(false);
    }
  };

  const onStart = async () => {
    setActionError(null);
    setStarting(true);
    try {
      await startDuel(duelId);
    } catch (e) {
      setActionError(e instanceof V1ApiError ? e.message : "Could not start the duel.");
    } finally {
      setStarting(false);
    }
  };

  const onCopyInvite = async () => {
    if (!inviteCode) return;
    try {
      const link = `${window.location.origin}/duels?invite=${encodeURIComponent(inviteCode)}`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — code stays visible as text */
    }
  };

  const statusText = (() => {
    if (!state) return "Loading duel room…";
    if (state.status === "waiting" && !opponent) return "Waiting for opponent to join…";
    if (state.status === "waiting" && !bothReady) return "Waiting for both players to ready up…";
    if (state.status === "waiting") return "Both ready — starting…";
    if (state.status === "active" && countdownLeft !== null && countdownLeft > 0)
      return `Starting in ${countdownLeft}…`;
    if (state.status === "active") return "Duel active — opening Arena…";
    if (state.status === "completed") return "Duel finished.";
    if (state.status === "expired") return "Duel expired — draw.";
    return "Duel cancelled.";
  })();

  return (
    <div style={{ minHeight: "100vh", background: "#020806", color: COLORS.text, padding: "24px 16px 48px" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Friend Duel · Live room
            </div>
            <h1 style={{ margin: "4px 0 0", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em" }}>
              {state?.mode === "classic_30" ? "Classic — 30 minutes" : "Rapid — 10 minutes"}
            </h1>
          </div>
          <Link href="/duels" style={{ fontSize: "12px", color: COLORS.cyan, textDecoration: "none" }}>
            ← All duels
          </Link>
        </div>

        {auth.status === "loading" && <p style={{ fontSize: "13px", color: COLORS.muted }}>Loading…</p>}

        {auth.status === "signed_out" && (
          <SignInGate
            onSignIn={() => void auth.signIn()}
            busy={auth.busy}
            error={auth.error}
            title="Sign in to enter this duel room"
            message="Sign in to compete. A verified Codeforces handle is optional and is used only as an authoritative public identity."
          />
        )}

        {fatalError && (
          <div style={{ ...cardStyle(), borderColor: "rgba(255,77,109,0.4)" }}>
            <p style={{ fontSize: "13px", color: COLORS.red, margin: 0 }}>{fatalError}</p>
            <p style={{ fontSize: "12px", color: COLORS.muted, margin: "8px 0 0" }}>
              Only the two duel participants can view this room.
            </p>
          </div>
        )}

        {signedIn && !fatalError && (
          <>
            {/* Status banner / countdown */}
            <div
              style={{
                ...cardStyle(),
                marginBottom: "14px",
                textAlign: "center",
                borderColor:
                  countdownLeft !== null && countdownLeft > 0 ? "rgba(0,245,160,0.5)" : COLORS.border,
              }}
            >
              {countdownLeft !== null && countdownLeft > 0 ? (
                <div>
                  <div style={{ fontSize: "48px", fontWeight: 900, color: COLORS.mint, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
                    {countdownLeft}
                  </div>
                  <div style={{ fontSize: "12px", color: COLORS.muted, marginTop: "4px" }}>
                    Get ready — the Arena opens for both players.
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: "14px", fontWeight: 700 }}>{statusText}</div>
              )}
              {transientError && (
                <div style={{ fontSize: "11px", color: COLORS.amber, marginTop: "6px" }}>
                  Reconnecting… ({transientError})
                </div>
              )}
            </div>

            {/* Problem preview (safe metadata only) */}
            {state?.problem && (
              <div style={{ ...cardStyle(), marginBottom: "14px", background: "rgba(0,217,245,0.05)", borderColor: "rgba(0,217,245,0.2)" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                  Assigned problem — same for both players
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700 }}>{state.problem.name}</div>
                <div style={{ fontSize: "12px", color: COLORS.muted, marginTop: "4px" }}>
                  {state.problem.problem_id}
                  {state.problem.rating != null && ` · rated ${state.problem.rating}`}
                  {state.problem.tags.length > 0 && ` · ${state.problem.tags.slice(0, 3).join(", ")}`}
                </div>
                <div style={{ fontSize: "11px", color: COLORS.muted, marginTop: "6px" }}>
                  {state.judging_note}
                </div>
              </div>
            )}

            {/* Player cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px", marginBottom: "14px" }}>
              {[me, opponent].map((p, i) => (
                <div key={i} style={{ ...cardStyle(), borderColor: p?.ready ? "rgba(0,245,160,0.4)" : COLORS.border }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                    {i === 0 ? "You" : "Opponent"}
                  </div>
                  {p ? (
                    <>
                      <div style={{ fontSize: "15px", fontWeight: 700 }}>
                        {p.display_name}
                        {p.handle ? <span style={{ color: COLORS.muted, fontWeight: 400 }}> @{p.handle}</span> : null}
                      </div>
                      <div style={{ fontSize: "12px", marginTop: "6px", color: p.ready ? COLORS.mint : COLORS.amber, fontWeight: 600 }}>
                        {p.ready ? "✓ Ready" : "Joined — not ready"}
                      </div>
                      <div style={{ fontSize: "11px", color: COLORS.muted, marginTop: "2px" }}>
                        {p.role === "creator" ? "Duel creator" : "Challenger"}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: "13px", color: COLORS.amber }}>Waiting for a friend to join…</div>
                  )}
                </div>
              ))}
            </div>

            {/* Invite link (creator's browser only) */}
            {state?.status === "waiting" && !opponent && inviteCode && (
              <div style={{ ...cardStyle(), marginBottom: "14px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", marginBottom: "8px" }}>
                  Invite a friend
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <code style={{ fontSize: "12px", color: COLORS.cyan, wordBreak: "break-all", flex: "1 1 200px" }}>
                    {inviteCode}
                  </code>
                  <button type="button" style={btn(false)} onClick={onCopyInvite}>
                    {copied ? "Copied!" : "Copy invite link"}
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            {state && (state.status === "waiting" || state.status === "active") && (
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
                {state.status === "waiting" && (
                  <>
                    <button type="button" style={btn(true, Boolean(me?.ready) || readying)} onClick={onReady} disabled={Boolean(me?.ready) || readying}>
                      {me?.ready ? "✓ You are ready" : readying ? "…" : "Ready"}
                    </button>
                    <button type="button" style={btn(false, !bothReady || starting)} onClick={onStart} disabled={!bothReady || starting}>
                      {starting ? "Starting…" : "Start duel"}
                    </button>
                  </>
                )}
                {state.status === "active" && (
                  <Link href={arenaHref(state)} style={{ ...btn(true), textDecoration: "none", display: "inline-block" }}>
                    Enter Arena →
                  </Link>
                )}
              </div>
            )}

            {/* Finished duel → result summary */}
            {state && (state.status === "completed" || state.status === "expired") && state.result && (
              <div style={{ ...cardStyle(), marginBottom: "14px", textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: 800, color: state.result.viewer_won ? COLORS.mint : state.result.is_draw ? COLORS.muted : COLORS.red }}>
                  {state.result.viewer_won ? "You won!" : state.result.is_draw ? "Draw" : "You lost"}
                </div>
                {state.result.winner_display_name && (
                  <div style={{ fontSize: "12px", color: COLORS.muted, marginTop: "4px" }}>
                    Winner: {state.result.winner_display_name}
                    {state.result.result_reason ? ` · ${state.result.result_reason.replace(/_/g, " ")}` : ""}
                  </div>
                )}
                <div style={{ marginTop: "10px" }}>
                  <Link href={arenaHref(state)} style={{ fontSize: "12px", color: COLORS.cyan }}>
                    View result in Arena →
                  </Link>
                </div>
              </div>
            )}

            {actionError && <p style={{ fontSize: "12px", color: COLORS.red }}>{actionError}</p>}

            <p style={{ fontSize: "11px", color: COLORS.muted }}>
              Practice judging — you&apos;re scored against one shared custom test, not official Codeforces
              tests. Hints help, but fewer hints wins ties. First to pass the shared test wins — if both
              pass, fewer hints, then earlier pass, then fewer wrong attempts decide.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function DuelRoomClient({ duelId }: { duelId: string }) {
  return (
    <Suspense fallback={<div style={{ background: "#020806", color: "#8A9A96", padding: "40px", textAlign: "center" }}>Loading duel room…</div>}>
      <DuelRoomContent duelId={duelId} />
    </Suspense>
  );
}
