"use client";

/**
 * SolveX gamification widget (Phase G1 + G2, security hotfix): XP, level,
 * streak, daily goal, badges, recent activity breakdown, daily/weekly
 * quests, and milestones.
 *
 * This widget is intentionally isolated: it fetches and renders on its own,
 * catches its own errors, and never throws. A failed or slow gamification
 * call must never break analysis, the daily queue, plans, Arena, or Copilot.
 *
 * Security: XP/streak/badges are private SolveX-account data — a Codeforces
 * handle alone no longer selects whose data to show. The widget always shows
 * the SIGNED-IN caller's own snapshot (never the `handle` being analyzed on
 * this page) and prompts to sign in otherwise.
 *
 * G2 fields are optional in the API response — if the backend returns a G1-only
 * shape, the widget still renders core stats and simply hides the new sections.
 *
 * G3 adds an isolated private-leaderboard section (invite-only weekly groups).
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  GamificationBadge,
  GamificationSnapshot,
  V1ApiError,
  getApiToken,
  getGamification,
} from "@/lib/v1Api";
import { useAuth } from "@/hooks/useAuth";
import SignInGate from "@/components/auth/SignInGate";
import HandleClaimPanel from "@/components/auth/HandleClaimPanel";

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

const RARITY_COLORS: Record<string, string> = {
  common: COLORS.cyan,
  uncommon: COLORS.amber,
  rare: COLORS.mint,
};

type Status = "loading" | "ready" | "error";

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      style={{
        height: "6px",
        background: "rgba(255,255,255,0.06)",
        borderRadius: "999px",
        overflow: "hidden",
      }}
    >
      <div
        className="tx-bar-grow"
        style={{ height: "100%", width: `${clamped}%`, background: color, borderRadius: "999px" }}
      />
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "12px",
        padding: "14px 16px",
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", marginBottom: "10px" }}>
        <div
          style={{
            fontSize: "10.5px",
            fontWeight: 700,
            color: COLORS.muted,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          {title}
        </div>
        {subtitle && <span style={{ fontSize: "11px", color: COLORS.muted }}>{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function StatCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="gami-stat-card"
      style={{
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "12px",
        padding: "14px 16px",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: "10.5px",
          fontWeight: 700,
          color: COLORS.muted,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          marginBottom: "8px",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function GamificationSkeleton() {
  return (
    <div className="gami-grid" aria-busy="true" aria-label="Loading training progress">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
            padding: "14px 16px",
            height: "76px",
          }}
        >
          <div
            style={{
              width: "50%",
              height: "10px",
              borderRadius: "4px",
              background: "rgba(255,255,255,0.06)",
              marginBottom: "10px",
              animation: "gami-pulse 1.4s ease-in-out infinite",
            }}
          />
          <div
            style={{
              width: "70%",
              height: "18px",
              borderRadius: "4px",
              background: "rgba(255,255,255,0.06)",
              animation: "gami-pulse 1.4s ease-in-out infinite",
            }}
          />
        </div>
      ))}
    </div>
  );
}

function GamificationError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      style={{
        background: COLORS.bg,
        border: `1px solid rgba(255,77,109,0.25)`,
        borderRadius: "12px",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: "13px", color: COLORS.muted }}>
        Training progress couldn&apos;t load right now.
      </span>
      <button
        onClick={onRetry}
        className="tx-press"
        style={{
          padding: "6px 14px",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          background: "transparent",
          color: COLORS.mint,
          border: `1px solid ${COLORS.mint}`,
          borderRadius: "8px",
        }}
      >
        Retry
      </button>
    </div>
  );
}

function shortXpLabel(label: string): string {
  const map: Record<string, string> = {
    "Upgraded to premium": "Beta Premium",
    "Completed first analysis": "First Diagnosis",
    "Generated first queue": "Queued Up",
    "Generated today's queue": "Today's Queue",
    "Submitted problem feedback": "Feedback",
    "Viewed weekly report": "Weekly Report",
    "Attempted SkillTrace verification": "SkillTrace",
    "Started a training plan": "Plan Started",
  };
  return map[label] ?? label;
}

function RecentActivity({ events }: { events: NonNullable<GamificationSnapshot["recent_xp_events"]> }) {
  const visible = events.filter((e) => e.xp_awarded > 0 || e.daily_cap_applied).slice(0, 8);
  if (visible.length === 0) {
    return (
      <p style={{ fontSize: "12px", color: COLORS.muted, margin: 0 }}>
        Complete an analysis or generate a queue to start earning XP.
      </p>
    );
  }
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
      {visible.map((event, i) => (
        <li
          key={`${event.event_type}-${event.occurred_at}-${i}`}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", fontSize: "12px" }}
        >
          <span style={{ color: COLORS.text, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {shortXpLabel(event.label)}
          </span>
          <span style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "6px" }}>
            {event.daily_cap_applied && event.xp_awarded === 0 && (
              <span style={{ fontSize: "10px", color: COLORS.muted }}>capped</span>
            )}
            <span
              style={{
                fontWeight: 700,
                color: event.xp_awarded > 0 ? COLORS.mint : COLORS.muted,
              }}
            >
              {event.xp_awarded > 0 ? `+${event.xp_awarded}` : "0"} XP
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function QuestList({
  quests,
  showProgress,
}: {
  quests: { id: string; label: string; completed: boolean; progress?: number; target?: number }[];
  showProgress?: boolean;
}) {
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "5px" }}>
      {quests.map((q) => (
        <li
          key={q.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: q.completed ? COLORS.mint : COLORS.muted,
          }}
        >
          <span aria-hidden style={{ fontSize: "11px", flexShrink: 0 }}>
            {q.completed ? "✓" : "○"}
          </span>
          <span style={{ flex: 1, minWidth: 0, color: q.completed ? COLORS.text : COLORS.muted }}>
            {q.label}
          </span>
          {showProgress && q.target !== undefined && q.progress !== undefined && !q.completed && (
            <span style={{ fontSize: "10px", color: COLORS.muted, flexShrink: 0 }}>
              {q.progress}/{q.target}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function BadgePill({ badge }: { badge: GamificationBadge }) {
  const color = RARITY_COLORS[badge.rarity ?? "common"] ?? COLORS.cyan;
  return (
    <span
      title={`${badge.description}${badge.category ? ` · ${badge.category}` : ""}`}
      style={{
        fontSize: "11px",
        fontWeight: 600,
        color,
        background: `${color}14`,
        border: `1px solid ${color}33`,
        borderRadius: "999px",
        padding: "3px 10px",
        whiteSpace: "nowrap",
      }}
    >
      {badge.name}
    </span>
  );
}

function MilestonesRow({ milestones }: { milestones: NonNullable<GamificationSnapshot["milestones"]> }) {
  const visible = milestones.slice(0, 3);
  if (visible.length === 0) return null;
  return (
    <div className="gami-milestones" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {visible.map((m) => {
        const pct = m.target > 0 ? Math.round((m.progress / m.target) * 100) : 0;
        return (
          <div key={m.id}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: COLORS.muted, marginBottom: "4px" }}>
              <span>{m.label}</span>
              <span>
                {m.progress}/{m.target}
              </span>
            </div>
            <ProgressBar percent={pct} color={COLORS.cyan} />
          </div>
        );
      })}
    </div>
  );
}

export function GamificationWidget({ handle }: { handle: string }) {
  const auth = useAuth();
  const signedIn = auth.status === "signed_in" && !!auth.user;
  const accountId = signedIn ? auth.user!.user_id : null;
  const [status, setStatus] = useState<Status>("loading");
  const [snapshot, setSnapshot] = useState<{ accountId: string; data: GamificationSnapshot } | null>(null);
  const data = snapshot?.accountId === accountId ? snapshot.data : null;

  const load = useCallback(async () => {
    const requestedAccount = accountId;
    const requestedToken = getApiToken();
    if (!requestedAccount) {
      setStatus("ready");
      return;
    }
    setStatus("loading");
    try {
      const snapshot = await getGamification();
      if (getApiToken() !== requestedToken) return;
      setSnapshot({ accountId: requestedAccount, data: snapshot });
      setStatus("ready");
    } catch (err) {
      if (getApiToken() !== requestedToken) return;
      void (err instanceof V1ApiError ? err.message : err);
      setSnapshot(null);
      setStatus("error");
    }
  }, [accountId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (auth.status === "loading") {
    return (
      <div style={{ marginBottom: "20px" }}>
        <style>{`
          @keyframes gami-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        `}</style>
        <GamificationSkeleton />
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div style={{ marginBottom: "20px" }}>
        <SignInGate
          onSignIn={() => void auth.signIn()}
          busy={auth.busy}
          error={auth.error}
          title="Track your XP, streak, and badges"
          message={`The analysis for ${handle || "this handle"} is public. Sign in to see your own private XP; then verify only a Codeforces handle you control.`}
        />
      </div>
    );
  }

  const accountContext = (
    <div
      style={{
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "12px",
        padding: "14px 16px",
        marginBottom: "10px",
      }}
    >
      <p style={{ fontSize: "12px", color: COLORS.muted, margin: "0 0 10px", lineHeight: "17px" }}>
        Viewing public analysis for <strong style={{ color: COLORS.text }}>{handle}</strong>. Private stats below belong to {auth.user?.handle ? (
          <strong style={{ color: COLORS.mint }}>your verified account @{auth.user.handle}</strong>
        ) : (
          <strong style={{ color: COLORS.text }}>your signed-in, unverified SolveX account</strong>
        )}.
      </p>
      {!auth.user?.handle_verified && auth.user && (
        <HandleClaimPanel user={auth.user} onVerified={() => void auth.refresh()} />
      )}
    </div>
  );

  if (status === "loading") {
    return (
      <div style={{ marginBottom: "20px" }}>
        {accountContext}
        <style>{`
          @keyframes gami-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        `}</style>
        <GamificationSkeleton />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ marginBottom: "20px" }}>
        {accountContext}
        <GamificationError onRetry={load} />
      </div>
    );
  }

  if (!data) return null;

  const isEmpty = data.xp_total === 0 && data.badges.length === 0 && data.streak.current === 0;
  const earnedBadges = data.badges;
  const recentEvents = data.recent_xp_events;
  const dailyQuests = data.daily_quests;
  const weeklyQuests = data.weekly_quests;
  const milestones = data.milestones;

  return (
    <div className="gami-widget" style={{ marginBottom: "24px" }}>
      {accountContext}
      <style>{`
        .gami-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }
        .gami-badges-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }
        .gami-quests-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        @media (max-width: 640px) {
          .gami-grid { grid-template-columns: 1fr; }
          .gami-quests-grid { grid-template-columns: 1fr; }
          .gami-header-row { flex-direction: column; align-items: flex-start !important; gap: 10px !important; }
        }
      `}</style>

      {/* Header: level + XP + progress to next level */}
      <div
        style={{
          background: "rgba(0,245,160,0.025)",
          border: `1px solid rgba(0,245,160,0.18)`,
          borderRadius: "14px",
          padding: "16px 18px",
          marginBottom: "10px",
        }}
      >
        <div
          className="gami-header-row"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #00F5A0, #00D9F5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "15px",
                color: "#020806",
                flexShrink: 0,
              }}
            >
              L{data.level}
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: COLORS.text, letterSpacing: "-0.01em" }}>
                Level {data.level}
              </div>
              <div style={{ fontSize: "12px", color: COLORS.muted }}>{data.xp_total} XP total</div>
            </div>
          </div>
          <div style={{ minWidth: "160px", flex: "1 1 200px", maxWidth: "320px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: COLORS.muted, marginBottom: "5px" }}>
              <span>{data.level_progress.current_level_xp} XP</span>
              <span>{data.level_progress.progress_percent}% to level {data.level + 1}</span>
              <span>{data.level_progress.next_level_xp} XP</span>
            </div>
            <ProgressBar percent={data.level_progress.progress_percent} color={COLORS.mint} />
          </div>
        </div>
        {isEmpty && !recentEvents?.length && (
          <p style={{ fontSize: "12px", color: COLORS.muted, marginTop: "12px", marginBottom: 0 }}>
            Run an analysis or generate today&apos;s queue to start earning XP.
          </p>
        )}
      </div>

      {/* Streak / daily goal / badges */}
      <div className="gami-grid" style={{ marginBottom: "10px" }}>
        <StatCard title="Streak">
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "20px", fontWeight: 800, color: COLORS.text, letterSpacing: "-0.02em" }}>
              {data.streak.current}
            </span>
            <span style={{ fontSize: "12px", color: COLORS.muted }}>day{data.streak.current === 1 ? "" : "s"}</span>
            {data.streak.current > 0 && <span aria-hidden style={{ fontSize: "14px" }}>🔥</span>}
          </div>
          <div style={{ fontSize: "11px", color: COLORS.muted, marginTop: "4px" }}>
            Longest {data.streak.longest} · {data.streak.today_completed ? "today done" : "not yet today"}
          </div>
        </StatCard>

        <StatCard title="Daily goal">
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: data.daily_goal.completed ? COLORS.mint : COLORS.text,
                letterSpacing: "-0.02em",
              }}
            >
              {data.daily_goal.completed_count}/{data.daily_goal.required_count}
            </span>
            {data.daily_goal.completed && <span aria-hidden style={{ fontSize: "13px" }}>✅</span>}
          </div>
          <div style={{ fontSize: "11px", color: COLORS.muted, marginTop: "4px" }}>
            {data.daily_goal.completed ? "Goal complete today" : "actions completed today"}
          </div>
        </StatCard>

        <StatCard title="Badges">
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "20px", fontWeight: 800, color: COLORS.text, letterSpacing: "-0.02em" }}>
              {earnedBadges.length}
            </span>
            <span style={{ fontSize: "12px", color: COLORS.muted }}>earned</span>
          </div>
          {earnedBadges.length > 0 ? (
            <div className="gami-badges-row">
              {earnedBadges.map((badge) => (
                <BadgePill key={badge.id} badge={badge} />
              ))}
            </div>
          ) : (
            <div style={{ fontSize: "11px", color: COLORS.muted, marginTop: "4px" }}>None yet</div>
          )}
        </StatCard>
      </div>

      {/* G2: Recent XP activity */}
      {recentEvents && (
        <div style={{ marginBottom: "10px" }}>
          <SectionCard title="Recent activity">
            <RecentActivity events={recentEvents} />
          </SectionCard>
        </div>
      )}

      {/* G2: Daily + weekly quests */}
      {(dailyQuests || weeklyQuests) && (
        <div className="gami-quests-grid" style={{ marginBottom: "10px" }}>
          {dailyQuests && (
            <SectionCard
              title="Daily quests"
              subtitle={`${dailyQuests.completed_count}/${dailyQuests.total_count}`}
            >
              <QuestList quests={dailyQuests.quests} />
            </SectionCard>
          )}
          {weeklyQuests && (
            <SectionCard
              title="Weekly quests"
              subtitle={`${weeklyQuests.completed_count}/${weeklyQuests.total_count}`}
            >
              <QuestList quests={weeklyQuests.quests} showProgress />
            </SectionCard>
          )}
        </div>
      )}

      {/* G2: Milestones (max 3) */}
      {milestones && milestones.length > 0 && (
        <SectionCard title="Next milestones">
          <MilestonesRow milestones={milestones} />
        </SectionCard>
      )}

      <div style={{ marginTop: "10px" }}>
        <Link
          href="/duels"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            fontWeight: 600,
            color: COLORS.cyan,
            textDecoration: "none",
            padding: "8px 12px",
            borderRadius: "8px",
            border: `1px solid ${COLORS.border}`,
            background: COLORS.bg,
          }}
        >
          Friend 1v1 duels →
        </Link>
      </div>
    </div>
  );
}
