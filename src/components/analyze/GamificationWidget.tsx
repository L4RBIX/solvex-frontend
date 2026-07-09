"use client";

/**
 * SolveX gamification widget (Phase G1): XP, level, streak, daily goal, and
 * earned badges for the current handle, rendered near the v1 training panel.
 *
 * This widget is intentionally isolated: it fetches and renders on its own,
 * catches its own errors, and never throws. A failed or slow gamification
 * call must never break analysis, the daily queue, plans, Arena, or Copilot —
 * it just falls back to a small inline error card with a retry button.
 *
 * No leaderboard, no duels, no social comparison, no public profile: this
 * view only ever shows the current handle's own private progress.
 */

import { useCallback, useEffect, useState } from "react";
import {
  GamificationSnapshot,
  V1ApiError,
  getGamification,
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

function StatCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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

export function GamificationWidget({ handle }: { handle: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<GamificationSnapshot | null>(null);

  const load = useCallback(async () => {
    if (!handle) {
      setStatus("ready");
      setData(null);
      return;
    }
    setStatus("loading");
    try {
      const snapshot = await getGamification(handle);
      setData(snapshot);
      setStatus("ready");
    } catch (err) {
      // Never let a gamification failure surface as an unhandled error —
      // the analyze page, queue, plans, and Copilot must keep working.
      void (err instanceof V1ApiError ? err.message : err);
      setData(null);
      setStatus("error");
    }
  }, [handle]);

  useEffect(() => {
    // `load()` sets loading/ready/error state from an external system (the
    // gamification API); this mirrors the same pattern already used for the
    // v1 training panel's token/plan refresh.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (status === "loading") {
    return (
      <div style={{ marginBottom: "20px" }}>
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
        <GamificationError onRetry={load} />
      </div>
    );
  }

  if (!data) return null; // no handle yet — render nothing rather than an empty shell

  const isEmpty = data.xp_total === 0 && data.badges.length === 0 && data.streak.current === 0;
  const earnedBadges = data.badges;

  return (
    <div className="gami-widget" style={{ marginBottom: "24px" }}>
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
        @media (max-width: 640px) {
          .gami-grid { grid-template-columns: 1fr; }
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
        {isEmpty && (
          <p style={{ fontSize: "12px", color: COLORS.muted, marginTop: "12px", marginBottom: 0 }}>
            Run an analysis or generate today&apos;s queue to start earning XP.
          </p>
        )}
      </div>

      {/* Streak / daily goal / badges */}
      <div className="gami-grid">
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
            <span style={{ fontSize: "20px", fontWeight: 800, color: data.daily_goal.completed ? COLORS.mint : COLORS.text, letterSpacing: "-0.02em" }}>
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
                <span
                  key={badge.id}
                  title={badge.description}
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: COLORS.cyan,
                    background: "rgba(0,217,245,0.08)",
                    border: "1px solid rgba(0,217,245,0.2)",
                    borderRadius: "999px",
                    padding: "3px 10px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {badge.name}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: "11px", color: COLORS.muted, marginTop: "4px" }}>None yet</div>
          )}
        </StatCard>
      </div>
    </div>
  );
}
