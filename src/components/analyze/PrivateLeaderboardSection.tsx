"use client";

/**
 * Private weekly leaderboard section (Phase G3, security hotfix).
 *
 * Isolated from core gamification: failures here never break /analyze, the
 * daily queue, plans, Arena, or Copilot. Invite-only — no global ranking.
 *
 * Security: membership requires a signed-in account (a Codeforces handle is
 * public data and carries no membership weight on its own) — shows a
 * SignInGate until the visitor signs in.
 */

import { useCallback, useEffect, useState } from "react";
import {
  LeaderboardSummary,
  LeaderboardWeeklyResponse,
  V1ApiError,
  createLeaderboard,
  getApiToken,
  getLeaderboardWeekly,
  joinLeaderboard,
  listLeaderboards,
} from "@/lib/v1Api";
import { useAuth } from "@/hooks/useAuth";
import SignInGate from "@/components/auth/SignInGate";

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
  const auth = useAuth();
  const signedIn = auth.status === "signed_in" && !!auth.user;
  const accountId = signedIn ? auth.user!.user_id : null;
  const [status, setStatus] = useState<Status>("loading");
  const [groupState, setGroupState] = useState<{ accountId: string; groups: LeaderboardSummary[] } | null>(null);
  const groups = groupState?.accountId === accountId ? groupState.groups : [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [weeklyState, setWeeklyState] = useState<{ accountId: string; weekly: LeaderboardWeeklyResponse } | null>(null);
  const weekly = weeklyState?.accountId === accountId ? weeklyState.weekly : null;
  const [weeklyStatus, setWeeklyStatus] = useState<Status>("loading");

  const [createName, setCreateName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [actionMsgState, setActionMsgState] = useState<{ accountId: string; value: string } | null>(null);
  const actionMsg = actionMsgState?.accountId === accountId ? actionMsgState.value : null;
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [lastInviteState, setLastInviteState] = useState<{ accountId: string; value: string } | null>(null);
  const lastInvite = lastInviteState?.accountId === accountId ? lastInviteState.value : null;

  const loadGroups = useCallback(async () => {
    const requestedAccount = accountId;
    const requestedToken = getApiToken();
    if (!requestedAccount) {
      setStatus("ready");
      return;
    }
    setStatus("loading");
    try {
      const res = await listLeaderboards();
      if (getApiToken() !== requestedToken) return;
      setGroupState({ accountId: requestedAccount, groups: res.leaderboards });
      setSelectedId((prev) => {
        if (prev && res.leaderboards.some((g) => g.leaderboard_id === prev)) return prev;
        return res.leaderboards[0]?.leaderboard_id ?? null;
      });
      setStatus("ready");
    } catch {
      if (getApiToken() !== requestedToken) return;
      setGroupState({ accountId: requestedAccount, groups: [] });
      setStatus("error");
    }
  }, [accountId]);

  const loadWeekly = useCallback(async (leaderboardId: string | null) => {
    const requestedAccount = accountId;
    const requestedToken = getApiToken();
    if (!requestedAccount || !leaderboardId) {
      setWeeklyStatus("ready");
      return;
    }
    setWeeklyStatus("loading");
    try {
      const res = await getLeaderboardWeekly(leaderboardId);
      if (getApiToken() !== requestedToken) return;
      setWeeklyState({ accountId: requestedAccount, weekly: res });
      setWeeklyStatus("ready");
    } catch {
      if (getApiToken() !== requestedToken) return;
      setWeeklyState(null);
      setWeeklyStatus("error");
    }
  }, [accountId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadWeekly(selectedId);
  }, [selectedId, loadWeekly]);

  const onCreate = async () => {
    const requestedAccount = accountId;
    const requestedToken = getApiToken();
    if (!requestedAccount) return;
    setActionErr(null);
    setActionMsgState(null);
    if (!createName.trim()) {
      setActionErr("Enter a group name.");
      return;
    }
    try {
      const created = await createLeaderboard(createName.trim());
      if (getApiToken() !== requestedToken) return;
      setLastInviteState({ accountId: requestedAccount, value: created.invite_code });
      setActionMsgState({
        accountId: requestedAccount,
        value: `Created "${created.name}". Share the invite code with friends.`,
      });
      setCreateName("");
      await loadGroups();
      if (getApiToken() !== requestedToken) return;
      setSelectedId(created.leaderboard_id);
    } catch (err) {
      if (getApiToken() !== requestedToken) return;
      setActionErr(err instanceof V1ApiError ? err.message : "Could not create leaderboard.");
    }
  };

  const onJoin = async () => {
    const requestedAccount = accountId;
    const requestedToken = getApiToken();
    if (!requestedAccount) return;
    setActionErr(null);
    setActionMsgState(null);
    if (!inviteCode.trim()) {
      setActionErr("Enter an invite code.");
      return;
    }
    try {
      const joined = await joinLeaderboard(inviteCode.trim());
      if (getApiToken() !== requestedToken) return;
      setActionMsgState({
        accountId: requestedAccount,
        value: joined.already_member ? `Already in "${joined.name}".` : `Joined "${joined.name}".`,
      });
      setInviteCode("");
      await loadGroups();
      if (getApiToken() !== requestedToken) return;
      setSelectedId(joined.leaderboard_id);
    } catch (err) {
      if (getApiToken() !== requestedToken) return;
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

      {!signedIn ? (
        <SignInGate
          onSignIn={() => void auth.signIn()}
          busy={auth.busy}
          error={auth.error}
          title="Sign in for private leaderboards"
          message={`The analysis for ${handle || "this handle"} is public. Private leaderboard membership always belongs to a signed-in SolveX account.`}
        />
      ) : (
        <>
      <p style={{ fontSize: "11px", color: COLORS.muted, margin: "0 0 10px", lineHeight: "16px" }}>
        Viewing <strong style={{ color: COLORS.text }}>{handle}</strong> publicly; leaderboard actions belong to <strong style={{ color: COLORS.text }}>{auth.user?.handle ? `@${auth.user.handle}` : "your signed-in account"}</strong>.
        {auth.user?.handle ? " Verified handles are used as authoritative member names." : " SolveX uses a server-generated member label until you verify your own handle."}
      </p>
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
        </>
      )}
    </div>
  );
}
