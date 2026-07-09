"use client";

/**
 * Friend 1v1 duels page (Phase G4). Invite-link only — no matchmaking.
 * Failures here never break /analyze or /arena.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CreateDuelResponse,
  DuelDetail,
  DuelMode,
  DuelSummary,
  V1ApiError,
  createDuel,
  getDuel,
  joinDuel,
  listDuels,
  startDuel,
  submitDuel,
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
      return "Active";
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

function DuelsContent() {
  const searchParams = useSearchParams();
  const handle = (searchParams.get("handle") || "").trim();
  const duelParam = searchParams.get("duel");

  const [displayName, setDisplayName] = useState(handle || "Player");
  const [mode, setMode] = useState<DuelMode>("rapid_10");
  const [inviteCode, setInviteCode] = useState("");
  const [list, setList] = useState<DuelSummary[]>([]);
  const [selected, setSelected] = useState<DuelDetail | null>(null);
  const [lastInvite, setLastInvite] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [language, setLanguage] = useState<"python3" | "cpp17">("python3");
  const [source, setSource] = useState("print(1)\n");
  const [stdin, setStdin] = useState("");
  const [expected, setExpected] = useState("1");
  const [submitting, setSubmitting] = useState(false);

  const loadList = useCallback(async () => {
    if (!handle) return;
    try {
      const res = await listDuels(handle);
      setList(res.duels);
    } catch {
      // Isolated — list failure must not crash the page.
    }
  }, [handle]);

  const loadDuel = useCallback(
    async (duelId: string) => {
      if (!handle) return;
      setLoading(true);
      setErr(null);
      try {
        const detail = await getDuel(duelId, handle);
        setSelected(detail);
      } catch (e) {
        setSelected(null);
        setErr(e instanceof V1ApiError ? e.message : "Could not load duel.");
      } finally {
        setLoading(false);
      }
    },
    [handle]
  );

  useEffect(() => {
    setDisplayName(handle || "Player");
    loadList();
  }, [handle, loadList]);

  useEffect(() => {
    if (duelParam && handle) {
      loadDuel(duelParam);
    }
  }, [duelParam, handle, loadDuel]);

  const onCreate = async () => {
    setErr(null);
    setMsg(null);
    if (!handle) {
      setErr("Add ?handle=your_cf_handle to the URL first.");
      return;
    }
    try {
      const created: CreateDuelResponse = await createDuel(mode, displayName.trim() || handle, handle);
      setLastInvite(created.invite_code);
      setMsg(`Duel created. Share the invite code with a friend.`);
      await loadList();
      await loadDuel(created.duel_id);
    } catch (e) {
      setErr(e instanceof V1ApiError ? e.message : "Could not create duel.");
    }
  };

  const onJoin = async () => {
    setErr(null);
    setMsg(null);
    if (!handle) {
      setErr("Add ?handle=your_cf_handle to the URL first.");
      return;
    }
    if (!inviteCode.trim()) {
      setErr("Enter an invite code.");
      return;
    }
    try {
      const joined = await joinDuel(inviteCode.trim(), displayName.trim() || handle, handle);
      setMsg(joined.already_member ? "Already in this duel." : "Joined duel.");
      setInviteCode("");
      await loadList();
      await loadDuel(joined.duel_id);
    } catch (e) {
      const message = e instanceof V1ApiError ? e.message : "Could not join.";
      setErr(message.toLowerCase().includes("invite") ? "Invite code is invalid or expired." : message);
    }
  };

  const onStart = async () => {
    if (!selected || !handle) return;
    setErr(null);
    try {
      const detail = await startDuel(selected.duel_id, handle);
      setSelected(detail);
      setMsg("Duel started — first accepted solution wins.");
      await loadList();
    } catch (e) {
      setErr(e instanceof V1ApiError ? e.message : "Could not start duel.");
    }
  };

  const onSubmit = async () => {
    if (!selected || !handle) return;
    setSubmitting(true);
    setErr(null);
    try {
      const res = await submitDuel(
        selected.duel_id,
        {
          language,
          source_code: source,
          stdin,
          expected_output: expected || null,
        },
        handle
      );
      setSelected(res.duel);
      setMsg(
        res.passed
          ? res.duel.status === "completed"
            ? "Accepted — duel completed!"
            : "Accepted!"
          : `Not accepted (${res.judge_status}).`
      );
      await loadList();
    } catch (e) {
      setErr(e instanceof V1ApiError ? e.message : "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const arenaHref = useMemo(() => {
    if (!selected?.problem) return "/arena";
    const params = new URLSearchParams();
    if (handle) params.set("handle", handle);
    params.set("duel", selected.duel_id);
    if (selected.problem.problem_id) params.set("problem", selected.problem.problem_id);
    return `/arena?${params.toString()}`;
  }, [selected, handle]);

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

        {!handle && (
          <p style={{ ...cardStyle(), fontSize: "13px", color: COLORS.amber, marginBottom: "14px" }}>
            Open with a Codeforces handle, e.g. <code>/duels?handle=dan1c</code>
          </p>
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
              <button type="button" style={btn(true)} onClick={onCreate} disabled={!handle}>
                Create duel
              </button>
            </div>
            {lastInvite && (
              <p style={{ fontSize: "12px", color: COLORS.cyan, marginTop: "10px", marginBottom: 0, wordBreak: "break-all" }}>
                Invite code: <strong>{lastInvite}</strong>
              </p>
            )}
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
              <button type="button" style={btn(false)} onClick={onJoin} disabled={!handle}>
                Join
              </button>
            </div>
          </div>
        </div>

        {msg && <p style={{ fontSize: "12px", color: COLORS.mint, marginTop: 0 }}>{msg}</p>}
        {err && <p style={{ fontSize: "12px", color: COLORS.red, marginTop: 0 }}>{err}</p>}

        {list.length > 0 && (
          <div style={{ ...cardStyle(), marginBottom: "16px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: COLORS.muted, marginBottom: "8px", textTransform: "uppercase" }}>
              Your duels
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
              {list.slice(0, 8).map((d) => (
                <li key={d.duel_id}>
                  <button
                    type="button"
                    onClick={() => loadDuel(d.duel_id)}
                    style={{
                      ...btn(selected?.duel_id === d.duel_id),
                      width: "100%",
                      textAlign: "left",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <span>
                      {d.mode} · {d.problem_id}
                    </span>
                    <span style={{ color: COLORS.muted }}>{statusLabel(d.status)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {loading && <p style={{ fontSize: "13px", color: COLORS.muted }}>Loading duel…</p>}

        {selected && (
          <div style={cardStyle()}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700 }}>{statusLabel(selected.status)}</div>
                <div style={{ fontSize: "12px", color: COLORS.muted }}>
                  {selected.mode} · expires {selected.expires_at.slice(0, 16).replace("T", " ")} UTC
                </div>
              </div>
              {selected.status === "waiting" && selected.participants.length >= 2 && (
                <button type="button" style={btn(true)} onClick={onStart}>
                  Start duel
                </button>
              )}
            </div>

            <div style={{ marginBottom: "12px", padding: "10px", borderRadius: "8px", background: "rgba(0,217,245,0.06)", border: `1px solid rgba(0,217,245,0.2)` }}>
              <div style={{ fontSize: "13px", fontWeight: 700 }}>{selected.problem.name}</div>
              <div style={{ fontSize: "12px", color: COLORS.muted, marginTop: "4px" }}>
                {selected.problem.problem_id}
                {selected.problem.rating != null && ` · ${selected.problem.rating}`}
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap" }}>
                {selected.problem.url && (
                  <a href={selected.problem.url} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: COLORS.cyan }}>
                    Open on Codeforces ↗
                  </a>
                )}
                <Link href={arenaHref} style={{ fontSize: "12px", color: COLORS.mint }}>
                  Open in Arena
                </Link>
              </div>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: COLORS.muted, marginBottom: "6px", textTransform: "uppercase" }}>
                Players
              </div>
              {selected.participants.map((p) => (
                <div
                  key={`${p.role}-${p.display_name}`}
                  style={{
                    fontSize: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 0",
                    borderTop: `1px solid ${COLORS.border}`,
                    color: p.is_winner ? COLORS.mint : COLORS.text,
                  }}
                >
                  <span>
                    {p.display_name}
                    {p.handle ? ` (@${p.handle})` : ""}
                    {p.is_viewer ? " · you" : ""}
                    {p.is_winner ? " · winner" : ""}
                  </span>
                  <span style={{ color: COLORS.muted }}>
                    {p.final_status}
                    {p.submission_count ? ` · ${p.submission_count} sub` : ""}
                  </span>
                </div>
              ))}
              {selected.status === "waiting" && selected.participants.length < 2 && (
                <p style={{ fontSize: "12px", color: COLORS.amber, margin: "8px 0 0" }}>Waiting for opponent…</p>
              )}
              {selected.status === "completed" && selected.result_reason && (
                <p style={{ fontSize: "12px", color: COLORS.mint, margin: "8px 0 0" }}>
                  Result: {selected.result_reason.replace(/_/g, " ")}
                </p>
              )}
              {selected.status === "expired" && (
                <p style={{ fontSize: "12px", color: COLORS.muted, margin: "8px 0 0" }}>Time expired — draw.</p>
              )}
            </div>

            {selected.status === "active" && (
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: COLORS.muted, marginBottom: "8px", textTransform: "uppercase" }}>
                  Submit solution
                </div>
                <p style={{ fontSize: "11px", color: COLORS.muted, marginTop: 0 }}>
                  Uses Judge0 sample judging (stdin + expected output), same as Arena. First accepted wins.
                </p>
                <div style={{ display: "grid", gap: "8px" }}>
                  <select style={inputStyle()} value={language} onChange={(e) => setLanguage(e.target.value as "python3" | "cpp17")}>
                    <option value="python3">Python 3</option>
                    <option value="cpp17">C++17</option>
                  </select>
                  <textarea
                    style={{ ...inputStyle(), minHeight: "120px", fontFamily: "ui-monospace, monospace", fontSize: "12px" }}
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    spellCheck={false}
                  />
                  <input style={inputStyle()} value={stdin} onChange={(e) => setStdin(e.target.value)} placeholder="stdin (optional)" />
                  <input style={inputStyle()} value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="expected output (optional)" />
                  <button type="button" style={btn(true)} onClick={onSubmit} disabled={submitting}>
                    {submitting ? "Judging…" : "Submit"}
                  </button>
                </div>
              </div>
            )}
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
