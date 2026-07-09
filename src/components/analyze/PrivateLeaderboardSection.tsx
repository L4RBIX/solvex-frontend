"use client";

/**
 * Private weekly leaderboard section (Phase G3).
 *
 * Isolated from core gamification: failures here never break /analyze, the
 * daily queue, plans, Arena, or Copilot. Invite-only — no global ranking.
 */

import { useCallback, useEffect, useState } from "react";
import {
  LeaderboardSummary,
  LeaderboardWeeklyResponse,
  V1ApiError,
  createLeaderboard,
  getLeaderboardWeekly,
  joinLeaderboard,
  listLeaderboards,
} from "@/lib/v1Api";

const COLORS = {
  bg: "#06100D",
  border: "#12271E",
  text: "#F4F7F6",
  muted: "#8A9A96",
  mint: "#00F5A0",
  cyan: "#00D9F5",
  red: "#FF4D6D",
};

type Status = "loading" | "ready" | "error";

function inputStyle(): React.CSSProperties {
  return {
    flex: "1 1 140px",
    minWidth: 0,
    padding: "8px 10px",
    fontSize: "12px",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "8px",
    color: COLORS.text,
  };
}

function buttonStyle(variant: "primary" | "ghost" = "primary"): React.CSSProperties {
  return {
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    borderRadius: "8px",
    border: variant === "primary" ? `1px solid ${COLORS.mint}` : `1px solid ${COLORS.border}`,
    background: variant === "primary" ? "rgba(0,245,160,0.08)" : "transparent",
    color: variant === "primary" ? COLORS.mint : COLORS.muted,
    whiteSpace: "nowrap",
  };
}

export function PrivateLeaderboardSection({ handle }: { handle: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [groups, setGroups] = useState<LeaderboardSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [weekly, setWeekly] = useState<LeaderboardWeeklyResponse | null>(null);
  const [weeklyStatus, setWeeklyStatus] = useState<Status>("loading");

  const [createName, setCreateName] = useState("");
  const [displayName, setDisplayName] = useState(handle);
  const [inviteCode, setInviteCode] = useState("");
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [lastInvite, setLastInvite] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    if (!handle) {
      setGroups([]);
      setStatus("ready");
      return;
    }
    setStatus("loading");
    try {
      const res = await listLeaderboards(handle);
      setGroups(res.leaderboards);
      setSelectedId((prev) => {
        if (prev && res.leaderboards.some((g) => g.leaderboard_id === prev)) return prev;
        return res.leaderboards[0]?.leaderboard_id ?? null;
      });
      setStatus("ready");
    } catch {
      setGroups([]);
      setStatus("error");
    }
  }, [handle]);

  const loadWeekly = useCallback(async (leaderboardId: string | null) => {
    if (!handle || !leaderboardId) {
      setWeekly(null);
      setWeeklyStatus("ready");
      return;
    }
    setWeeklyStatus("loading");
    try {
      const res = await getLeaderboardWeekly(leaderboardId, handle);
      setWeekly(res);
      setWeeklyStatus("ready");
    } catch {
      setWeekly(null);
      setWeeklyStatus("error");
    }
  }, [handle]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadWeekly(selectedId);
  }, [selectedId, loadWeekly]);

  const onCreate = async () => {
    setActionErr(null);
    setActionMsg(null);
    if (!createName.trim() || !displayName.trim()) {
      setActionErr("Enter a group name and your display name.");
      return;
    }
    try {
      const created = await createLeaderboard(createName.trim(), displayName.trim(), handle);
      setLastInvite(created.invite_code);
      setActionMsg(`Created "${created.name}". Share the invite code with friends.`);
      setCreateName("");
      await loadGroups();
      setSelectedId(created.leaderboard_id);
    } catch (err) {
      setActionErr(err instanceof V1ApiError ? err.message : "Could not create leaderboard.");
    }
  };

  const onJoin = async () => {
    setActionErr(null);
    setActionMsg(null);
    if (!inviteCode.trim() || !displayName.trim()) {
      setActionErr("Enter an invite code and display name.");
      return;
    }
    try {
      const joined = await joinLeaderboard(inviteCode.trim(), displayName.trim(), handle);
      setActionMsg(joined.already_member ? `Already in "${joined.name}".` : `Joined "${joined.name}".`);
      setInviteCode("");
      await loadGroups();
      setSelectedId(joined.leaderboard_id);
    } catch (err) {
      const msg = err instanceof V1ApiError ? err.message : "Could not join.";
      setActionErr(msg.includes("INVITE") || msg.includes("invite") ? "Invite code is invalid or expired." : msg);
    }
  };

  return (
    <div
      style={{
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "12px",
        padding: "14px 16px",
        marginTop: "10px",
      }}
    >
      <div style={{ marginBottom: "10px" }}>
        <div style={{ fontSize: "10.5px", fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Private leaderboard
        </div>
        <div style={{ fontSize: "12px", color: COLORS.muted, marginTop: "4px" }}>
          Compete with friends this week · Invite-only
        </div>
      </div>

      {status === "loading" && (
        <p style={{ fontSize: "12px", color: COLORS.muted, margin: 0 }}>Loading leaderboards…</p>
      )}

      {status === "error" && (
        <p style={{ fontSize: "12px", color: COLORS.red, margin: "0 0 8px" }}>
          Leaderboard unavailable right now.
          <button onClick={loadGroups} style={{ ...buttonStyle("ghost"), marginLeft: "8px" }} type="button">
            Retry
          </button>
        </p>
      )}

      {status === "ready" && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              style={inputStyle()}
              aria-label="Display name"
            />
            <input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="New group name"
              style={inputStyle()}
              aria-label="Leaderboard name"
            />
            <button type="button" onClick={onCreate} style={buttonStyle("primary")}>
              Create leaderboard
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Invite code"
              style={inputStyle()}
              aria-label="Invite code"
            />
            <button type="button" onClick={onJoin} style={buttonStyle("ghost")}>
              Join with code
            </button>
          </div>

          {actionMsg && <p style={{ fontSize: "11px", color: COLORS.mint, margin: "0 0 8px" }}>{actionMsg}</p>}
          {actionErr && <p style={{ fontSize: "11px", color: COLORS.red, margin: "0 0 8px" }}>{actionErr}</p>}
          {lastInvite && (
            <p style={{ fontSize: "11px", color: COLORS.cyan, margin: "0 0 8px", wordBreak: "break-all" }}>
              Invite code: <strong>{lastInvite}</strong>
            </p>
          )}

          {groups.length === 0 ? (
            <p style={{ fontSize: "12px", color: COLORS.muted, margin: 0 }}>
              No private leaderboard yet. Create one or join with an invite code.
            </p>
          ) : (
            <>
              {groups.length > 1 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                  {groups.map((g) => (
                    <button
                      key={g.leaderboard_id}
                      type="button"
                      onClick={() => setSelectedId(g.leaderboard_id)}
                      style={{
                        ...buttonStyle(selectedId === g.leaderboard_id ? "primary" : "ghost"),
                        fontSize: "11px",
                      }}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              )}

              {weeklyStatus === "loading" && (
                <p style={{ fontSize: "12px", color: COLORS.muted, margin: 0 }}>Loading weekly standings…</p>
              )}

              {weeklyStatus === "error" && (
                <p style={{ fontSize: "12px", color: COLORS.muted, margin: 0 }}>Could not load weekly standings.</p>
              )}

              {weeklyStatus === "ready" && weekly && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: COLORS.text }}>{weekly.name}</span>
                    <span style={{ fontSize: "11px", color: COLORS.muted }}>
                      Week of {weekly.week_start}
                      {weekly.viewer_rank != null && ` · Your rank #${weekly.viewer_rank}`}
                    </span>
                  </div>

                  {weekly.entries.length === 0 ? (
                    <p style={{ fontSize: "12px", color: COLORS.muted, margin: 0 }}>No activity this week yet.</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                        <thead>
                          <tr style={{ color: COLORS.muted, textAlign: "left" }}>
                            <th style={{ padding: "4px 6px 4px 0" }}>#</th>
                            <th style={{ padding: "4px 6px" }}>Name</th>
                            <th style={{ padding: "4px 6px" }}>XP</th>
                            <th style={{ padding: "4px 6px" }}>Days</th>
                            <th style={{ padding: "4px 6px" }}>Goals</th>
                          </tr>
                        </thead>
                        <tbody>
                          {weekly.entries.slice(0, 10).map((entry) => (
                            <tr
                              key={`${entry.rank}-${entry.display_name}`}
                              style={{
                                color: entry.rank === weekly.viewer_rank ? COLORS.mint : COLORS.text,
                                borderTop: `1px solid ${COLORS.border}`,
                              }}
                            >
                              <td style={{ padding: "6px 6px 6px 0" }}>{entry.rank}</td>
                              <td style={{ padding: "6px" }}>
                                {entry.display_name}
                                {entry.handle && (
                                  <span style={{ color: COLORS.muted, marginLeft: "4px" }}>@{entry.handle}</span>
                                )}
                              </td>
                              <td style={{ padding: "6px" }}>{entry.weekly_xp}</td>
                              <td style={{ padding: "6px" }}>{entry.active_days}</td>
                              <td style={{ padding: "6px" }}>{entry.daily_goals_completed}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
