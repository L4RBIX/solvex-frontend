"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { AnalysisResult, FrictionArea, QueueDay } from "@/lib/cfAnalysis";
import { V1ApiError, fetchLegacyAnalysis } from "@/lib/v1Api";
import { V1TrainingPanel } from "@/components/analyze/V1TrainingPanel";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pctOf(n: number, total: number) {
  if (total === 0) return 0;
  return Math.round((n / total) * 100);
}

function rankColor(rank: string): string {
  const r = rank.toLowerCase();
  if (r.includes("legendary")) return "#FF0000";
  if (r.includes("international") && r.includes("grandmaster")) return "#FF3333";
  if (r.includes("grandmaster")) return "#FF6666";
  if (r.includes("international") && r.includes("master")) return "#FF8C00";
  if (r.includes("master")) return "#FFAA33";
  if (r.includes("candidate")) return "#FFDD44";
  if (r.includes("expert")) return "#AA88FF";
  if (r.includes("specialist")) return "#00D9F5";
  if (r.includes("pupil")) return "#77DD77";
  return "#8A9A96";
}

function cfProblemLink(contestId?: number, index?: string): string | null {
  if (!contestId || !index) return null;
  return `https://codeforces.com/problemset/problem/${contestId}/${index}`;
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function Skeleton({ w = "100%", h = "16px" }: { w?: string; h?: string }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: "6px",
        background: "rgba(255,255,255,0.06)",
        animation: "tx-skeleton-pulse 1.4s ease-in-out infinite",
      }}
    />
  );
}

function LoadingDashboard({ handle }: { handle: string }) {
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px 80px" }}>
      <style>{`
        @keyframes tx-skeleton-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>

      {/* Profile skeleton */}
      <div
        style={{
          background: "#06100D",
          border: "1px solid rgba(0,245,160,0.14)",
          borderRadius: "16px",
          padding: "24px 28px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "48px", height: "48px", borderRadius: "12px",
            background: "rgba(0,245,160,0.1)", flexShrink: 0,
            animation: "tx-skeleton-pulse 1.4s ease-in-out infinite",
          }}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          <Skeleton w="140px" h="18px" />
          <Skeleton w="100px" h="13px" />
        </div>
        <div
          style={{
            padding: "6px 18px",
            borderRadius: "9999px",
            background: "rgba(0,245,160,0.06)",
            border: "1px solid rgba(0,245,160,0.2)",
            fontSize: "13px",
            color: "#00F5A0",
            fontWeight: 500,
          }}
        >
          Analyzing {handle}…
        </div>
      </div>

      {/* Summary cards skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "12px", marginBottom: "20px" }}>
        {[0,1,2,3].map(i => (
          <div key={i} className="tx-card" style={{ padding: "20px 24px" }}>
            <Skeleton w="60%" h="13px" />
            <div style={{ marginTop: "10px" }}><Skeleton w="40%" h="24px" /></div>
          </div>
        ))}
      </div>

      {/* Friction areas skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "14px" }}>
        {[0,1,2].map(i => (
          <div key={i} className="tx-card" style={{ padding: "24px" }}>
            <Skeleton w="50%" h="16px" />
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <Skeleton h="10px" />
              <Skeleton w="80%" h="10px" />
              <Skeleton w="60%" h="10px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({
  handle,
  message,
  onRetry,
  retrySecondsLeft = 0,
}: {
  handle: string;
  message: string;
  onRetry: () => void;
  retrySecondsLeft?: number;
}) {
  const retryBlocked = retrySecondsLeft > 0;
  return (
    <div style={{ textAlign: "center", padding: "80px 24px" }}>
      <div
        style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "4px 14px", borderRadius: "9999px",
          border: "1px solid rgba(255,77,109,0.3)",
          background: "rgba(255,77,109,0.06)",
          color: "#FF4D6D", fontSize: "12px", fontWeight: 600,
          letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "24px",
        }}
      >
        Analysis failed
      </div>
      <h2
        style={{
          fontFamily: "var(--font-rebond, system-ui)", fontWeight: 700,
          fontSize: "clamp(24px, 4vw, 36px)", color: "#F4F7F6",
          letterSpacing: "-0.03em", marginBottom: "12px",
        }}
      >
        Could not analyze <span style={{ color: "#FF4D6D" }}>{handle}</span>
      </h2>
      <p style={{ fontSize: "15px", color: "#8A9A96", maxWidth: "480px", margin: "0 auto 32px", lineHeight: "24px" }}>
        {message}
      </p>
      <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
        <button
          onClick={retryBlocked ? undefined : onRetry}
          disabled={retryBlocked}
          className="tx-press"
          style={{
            background: retryBlocked ? "rgba(0,245,160,0.25)" : "#00F5A0",
            color: retryBlocked ? "#8A9A96" : "#020806",
            fontSize: "14px", fontWeight: 700,
            padding: "11px 28px", borderRadius: "9999px",
            border: "none",
            cursor: retryBlocked ? "not-allowed" : "pointer",
            transition: "background 0.2s, transform 0.1s ease-out",
          }}
        >
          {retryBlocked ? `Try again in ${retrySecondsLeft}s` : "Try again"}
        </button>
        <Link
          href="/"
          className="tx-press"
          style={{
            display: "inline-flex", alignItems: "center",
            background: "transparent",
            border: "1px solid rgba(0,245,160,0.25)",
            color: "#00F5A0", fontSize: "14px", fontWeight: 600,
            padding: "11px 28px", borderRadius: "9999px", textDecoration: "none",
          }}
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}

// ─── Section title ────────────────────────────────────────────────────────────

function SectionTitle({ badge, title, subtitle }: { badge?: string; title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      {badge && (
        <div className="section-badge" style={{ marginBottom: "12px" }}>{badge}</div>
      )}
      <h2
        style={{
          fontFamily: "var(--font-rebond, system-ui)", fontWeight: 700,
          fontSize: "clamp(22px, 3vw, 28px)", color: "#F4F7F6",
          letterSpacing: "-0.03em", marginBottom: subtitle ? "8px" : 0,
        }}
      >
        {title}
      </h2>
      {subtitle && <p style={{ fontSize: "14px", color: "#8A9A96" }}>{subtitle}</p>}
    </div>
  );
}

// ─── Profile bar ──────────────────────────────────────────────────────────────

function ProfileBar({ data }: { data: AnalysisResult }) {
  const { profile, summary } = data;
  const rc = rankColor(profile.rank);

  return (
    <div
      className="tx-card"
      style={{
        padding: "20px 28px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: "20px",
        marginBottom: "20px",
        background: "rgba(0,245,160,0.025)",
        borderColor: "rgba(0,245,160,0.22)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            width: "48px", height: "48px", borderRadius: "12px",
            background: "linear-gradient(135deg, #00F5A0, #00D9F5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: "18px", color: "#020806", flexShrink: 0,
            fontFamily: "var(--font-rebond, system-ui)",
          }}
        >
          {profile.handle.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "17px", color: "#F4F7F6", letterSpacing: "-0.02em" }}>
            {profile.handle}
          </div>
          <div style={{ fontSize: "12px", color: "#8A9A96", marginTop: "1px" }}>
            {[profile.country, profile.organization].filter(Boolean).join(" · ") || "Codeforces"}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
        {[
          { v: profile.rating  || "—", l: "Rating",    c: rc },
          { v: profile.maxRating || "—", l: "Max rating", c: "#F4F7F6" },
          { v: summary.uniqueSolved, l: "Solved",      c: "#F4F7F6" },
          { v: summary.mainLanguage, l: "Language",    c: "#F4F7F6" },
          { v: <span style={{ color: rc, fontSize: "12px", fontWeight: 600 }}>{profile.rank}</span>, l: "Rank", c: "#F4F7F6" },
        ].map((m, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "17px", fontWeight: 700, color: typeof m.c === "string" ? m.c : "#F4F7F6",
                letterSpacing: "-0.03em", lineHeight: 1,
              }}
            >
              {m.v}
            </div>
            <div style={{ fontSize: "11px", color: "#8A9A96", marginTop: "3px" }}>{m.l}</div>
          </div>
        ))}
      </div>

      <a
        href={`https://codeforces.com/profile/${profile.handle}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: "12px", color: "#00D9F5",
          textDecoration: "none", display: "flex", alignItems: "center", gap: "4px",
          border: "1px solid rgba(0,217,245,0.2)", borderRadius: "9999px",
          padding: "5px 14px",
          transition: "background 0.15s",
        }}
      >
        View on CF →
      </a>
    </div>
  );
}

// ─── Summary metrics ──────────────────────────────────────────────────────────

function SummaryCards({ data }: { data: AnalysisResult }) {
  const { summary, errorBreakdown } = data;
  const totalErrors =
    errorBreakdown.wrongAnswer +
    errorBreakdown.timeLimitExceeded +
    errorBreakdown.runtimeError +
    errorBreakdown.compileError +
    errorBreakdown.memoryLimitExceeded +
    errorBreakdown.other;

  const cards = [
    { label: "Total submissions",   value: summary.totalSubmissions.toLocaleString(), sub: `${totalErrors} non-AC verdicts` },
    { label: "Unique solved",       value: summary.uniqueSolved.toLocaleString(),       sub: `avg ${summary.avgSolvedRating} rating solved` },
    { label: "Friction areas",      value: data.frictionAreas.length,                  sub: "tags with high retry cost" },
    { label: "Primary language",    value: summary.mainLanguage,                        sub: "most used in AC submissions" },
  ];

  return (
    <div
      style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
        gap: "12px", marginBottom: "48px",
      }}
    >
      {cards.map((c) => (
        <div key={c.label} className="tx-card" style={{ padding: "20px 24px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#8A9A96", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "10px" }}>
            {c.label}
          </div>
          <div
            style={{
              fontSize: "28px", fontWeight: 800, color: "#00F5A0",
              fontFamily: "var(--font-rebond, system-ui)", letterSpacing: "-0.04em",
              lineHeight: 1, marginBottom: "6px",
            }}
          >
            {c.value}
          </div>
          <div style={{ fontSize: "12px", color: "#8A9A96" }}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Diagnosis banner ─────────────────────────────────────────────────────────

function DiagnosisBanner({ text }: { text: string }) {
  return (
    <div
      style={{
        background: "rgba(0,245,160,0.04)",
        border: "1px solid rgba(0,245,160,0.12)",
        borderRadius: "12px", padding: "18px 22px", marginBottom: "48px",
      }}
    >
      <div
        style={{
          fontSize: "11px", fontWeight: 700, color: "#00F5A0",
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px",
        }}
      >
        SolveX Diagnosis
      </div>
      <p style={{ fontSize: "14.5px", lineHeight: "23px", color: "#c8d4d0", margin: 0 }}>
        {text}
      </p>
    </div>
  );
}

// ─── Friction area card ───────────────────────────────────────────────────────

function FrictionCard({ area }: { area: FrictionArea }) {
  const barPct = Math.min(Math.round(area.frictionScore * 1.8), 100); // visual only

  return (
    <div className="tx-card" style={{ padding: "24px", borderTop: `3px solid ${area.color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "16px" }}>
        <div>
          <h3
            style={{
              fontSize: "15px", fontWeight: 700, color: "#F4F7F6",
              letterSpacing: "-0.02em", marginBottom: "6px",
            }}
          >
            {area.tag.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
          </h3>
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {[
              area.waCount > 0  && `${area.waCount} WA`,
              area.tleCount > 0 && `${area.tleCount} TLE`,
              area.reCount > 0  && `${area.reCount} RE`,
            ].filter(Boolean).map((t) => (
              <span
                key={String(t)}
                style={{
                  fontSize: "10px", fontWeight: 600, color: area.color,
                  background: `${area.color}12`, borderRadius: "9999px",
                  padding: "2px 8px", letterSpacing: "0.02em",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span
          style={{
            fontSize: "10px", fontWeight: 700, color: area.color,
            background: `${area.color}12`, border: `1px solid ${area.color}28`,
            borderRadius: "9999px", padding: "3px 10px",
            textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0,
          }}
        >
          {area.confidence}
        </span>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: "10px", marginBottom: "18px",
        }}
      >
        {[
          { label: "Solved",    value: `${area.solved}/${area.attempted}` },
          { label: "Subs",      value: area.totalSubmissions },
          { label: "Avg tries", value: area.avgAttemptsBeforeAC },
        ].map((s) => (
          <div key={s.label}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#F4F7F6", letterSpacing: "-0.01em" }}>
              {String(s.value)}
            </div>
            <div style={{ fontSize: "11px", color: "#8A9A96", marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Friction bar */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
          <span style={{ fontSize: "11px", color: "#8A9A96" }}>Friction intensity</span>
          <span style={{ fontSize: "11px", fontWeight: 600, color: area.color }}>{barPct}%</span>
        </div>
        <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
          <div className="tx-bar-grow" style={{ height: "100%", width: `${barPct}%`, background: area.color, borderRadius: "4px" }} />
        </div>
      </div>

      {/* Action */}
      <div
        style={{
          background: "rgba(0,245,160,0.04)", border: "1px solid rgba(0,245,160,0.1)",
          borderRadius: "8px", padding: "10px 14px",
          fontSize: "12.5px", color: "#00F5A0",
          display: "flex", alignItems: "flex-start", gap: "8px", lineHeight: "18px",
        }}
      >
        <span style={{ flexShrink: 0 }}>→</span>
        <span>{area.action}</span>
      </div>
    </div>
  );
}

// ─── Error breakdown ──────────────────────────────────────────────────────────

function ErrorBreakdown({ data }: { data: AnalysisResult }) {
  const eb = data.errorBreakdown;
  const total = eb.wrongAnswer + eb.timeLimitExceeded + eb.runtimeError + eb.compileError + eb.memoryLimitExceeded + eb.other;

  const rows = [
    { label: "Wrong Answer",    count: eb.wrongAnswer,         color: "#FF4D6D" },
    { label: "Time Limit",      count: eb.timeLimitExceeded,   color: "#FACC15" },
    { label: "Runtime Error",   count: eb.runtimeError,        color: "#f97316" },
    { label: "Compile Error",   count: eb.compileError,        color: "#8A9A96" },
    { label: "Memory Limit",    count: eb.memoryLimitExceeded, color: "#8A9A96" },
    ...(eb.other > 0 ? [{ label: "Other", count: eb.other, color: "#8A9A96" }] : []),
  ].filter((r) => r.count > 0);

  const maxCount = rows[0]?.count ?? 1;

  return (
    <div className="tx-card" style={{ padding: "28px" }}>
      <div
        style={{
          fontSize: "11px", fontWeight: 700, color: "#8A9A96",
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "20px",
        }}
      >
        Error Breakdown · {total.toLocaleString()} non-AC verdicts
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {rows.map((r) => (
          <div key={r.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <span style={{ fontSize: "13px", color: "#c8d4d0" }}>{r.label}</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#F4F7F6" }}>
                {r.count.toLocaleString()}{" "}
                <span style={{ color: "#8A9A96", fontWeight: 400, fontSize: "11px" }}>
                  ({pctOf(r.count, total)}%)
                </span>
              </span>
            </div>
            <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
              <div
                className="tx-bar-grow"
                style={{
                  height: "100%",
                  width: `${pctOf(r.count, maxCount)}%`,
                  background: r.color, borderRadius: "2px",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Rating comfort zone ──────────────────────────────────────────────────────

function RatingComfortZone({ data }: { data: AnalysisResult }) {
  const { min, max, sweet } = data.ratingComfortZone;
  const buckets = [800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200];

  return (
    <div className="tx-card" style={{ padding: "28px" }}>
      <div
        style={{
          fontSize: "11px", fontWeight: 700, color: "#8A9A96",
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px",
        }}
      >
        Rating Comfort Zone
      </div>
      <div
        style={{
          fontSize: "32px", fontWeight: 800, color: "#00F5A0",
          fontFamily: "var(--font-rebond, system-ui)", letterSpacing: "-0.04em", marginBottom: "4px",
        }}
      >
        {min} – {max}
      </div>
      <div style={{ fontSize: "13px", color: "#8A9A96", marginBottom: "20px" }}>
        Sweet spot: <span style={{ color: "#F4F7F6", fontWeight: 600 }}>{sweet}</span> rating
      </div>

      {/* Mini rating ladder */}
      <div style={{ display: "flex", gap: "3px", alignItems: "flex-end" }}>
        {buckets.map((b) => {
          const inRange = b >= min && b <= max;
          const isSweet = b === sweet;
          return (
            <div key={b} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div
                style={{
                  width: "100%", height: isSweet ? "32px" : inRange ? "20px" : "10px",
                  borderRadius: "2px",
                  background: isSweet
                    ? "#00F5A0"
                    : inRange
                    ? "rgba(0,245,160,0.35)"
                    : "rgba(255,255,255,0.06)",
                  transition: "height 0.3s ease",
                }}
              />
              {b % 200 === 0 && (
                <span style={{ fontSize: "9px", color: "#8A9A96", whiteSpace: "nowrap" }}>{b}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Strong topics ────────────────────────────────────────────────────────────

function StrongTopics({ data }: { data: AnalysisResult }) {
  if (data.strongTopics.length === 0) return null;

  return (
    <div className="tx-card" style={{ padding: "28px" }}>
      <div
        style={{
          fontSize: "11px", fontWeight: 700, color: "#8A9A96",
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px",
        }}
      >
        Strong Topics
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {data.strongTopics.map((t) => (
          <div key={t.tag} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "7px", height: "7px", borderRadius: "50%",
                background: "#00F5A0", flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "13.5px", color: "#F4F7F6", flex: 1 }}>
              {t.tag.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
            </span>
            <span style={{ fontSize: "12px", color: "#8A9A96" }}>
              {t.solved} solved · {Math.round(t.solveRate * 100)}% AC
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Recommended problems ─────────────────────────────────────────────────────

function RecommendedProblems({ data }: { data: AnalysisResult }) {
  if (data.recommendedProblems.length === 0) {
    return (
      <div className="tx-card" style={{ padding: "28px", textAlign: "center", color: "#8A9A96", fontSize: "14px" }}>
        No pending retry-heavy problems found — all attempted problems were solved efficiently.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
        gap: "10px",
      }}
    >
      {data.recommendedProblems.map((p, i) => {
        const link = cfProblemLink(p.contestId, p.index);
        const Wrapper = link ? "a" : "div";
        const wrapperProps = link
          ? { href: link, target: "_blank", rel: "noopener noreferrer", style: { textDecoration: "none" } }
          : {};

        return (
          <Wrapper key={i} {...wrapperProps}>
            <div
              className="tx-card"
              style={{
                padding: "14px 16px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: "12px", cursor: link ? "pointer" : "default",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "13px", fontWeight: 600, color: "#F4F7F6",
                    letterSpacing: "-0.01em", marginBottom: "3px",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}
                >
                  {p.name}
                </div>
                <div style={{ fontSize: "11px", color: "#8A9A96", lineHeight: "16px" }}>
                  {p.reason}
                </div>
              </div>
              <div style={{ flexShrink: 0, textAlign: "right", display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" }}>
                <span
                  style={{
                    fontSize: "12px", fontWeight: 700, color: "#00F5A0",
                    background: "rgba(0,245,160,0.08)", borderRadius: "6px",
                    padding: "3px 8px", fontFamily: "ui-monospace, monospace",
                  }}
                >
                  {p.rating}
                </span>
                {p.contestId && p.index && (
                  <Link
                    href={`/arena?problem=${p.contestId}${p.index}`}
                    style={{
                      fontSize: "10px", fontFamily: "ui-monospace, monospace",
                      color: "#00F5A0", textDecoration: "none",
                      border: "1px solid rgba(0,245,160,0.25)",
                      borderRadius: "4px", padding: "2px 7px",
                      transition: "background 0.15s",
                      display: "inline-block",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Solve →
                  </Link>
                )}
              </div>
            </div>
          </Wrapper>
        );
      })}
    </div>
  );
}

// ─── 7-day queue ──────────────────────────────────────────────────────────────

function QueueTable({ queue }: { queue: QueueDay[] }) {
  return (
    <div
      style={{
        background: "#06100D",
        border: "1px solid rgba(0,245,160,0.16)",
        borderRadius: "16px", overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "grid", gridTemplateColumns: "52px 160px 1fr 80px 1fr",
          padding: "11px 24px",
          background: "rgba(0,245,160,0.03)",
          borderBottom: "1px solid rgba(0,245,160,0.08)",
        }}
      >
        {["Day", "Focus", "Problem", "Rating", "Reason"].map((h) => (
          <div key={h} style={{ fontSize: "10.5px", fontWeight: 700, color: "#8A9A96", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      {queue.map((row, i) => (
        <div
          key={row.day}
          style={{
            display: "grid", gridTemplateColumns: "52px 160px 1fr 80px 1fr",
            padding: "15px 24px",
            borderBottom: i < queue.length - 1 ? "1px solid rgba(0,245,160,0.06)" : "none",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,245,160,0.025)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#00F5A0", fontFamily: "ui-monospace, monospace" }}>
              {row.day}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                fontSize: "12px", fontWeight: 600, color: row.tagColor,
                background: `${row.tagColor}12`, borderRadius: "9999px", padding: "3px 10px",
              }}
            >
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: row.tagColor, display: "inline-block" }} />
              {row.focus}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#F4F7F6", letterSpacing: "-0.01em" }}>
              {row.problemName ?? "—"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                fontSize: "12px", fontWeight: 700, color: "#00F5A0",
                fontFamily: "ui-monospace, monospace",
                background: "rgba(0,245,160,0.08)", borderRadius: "6px", padding: "3px 8px",
              }}
            >
              {row.rating}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#8A9A96", lineHeight: "18px" }}>
              {row.reason}
            </span>
          </div>
        </div>
      ))}

      {/* Mobile responsive style */}
      <style>{`
        @media (max-width: 680px) {
          .queue-grid-row { grid-template-columns: 1fr !important; gap: 4px !important; }
          .queue-grid-header { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Full dashboard ───────────────────────────────────────────────────────────

function Dashboard({ data }: { data: AnalysisResult }) {
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px 100px" }}>
      <div className="tx-rise"><ProfileBar data={data} /></div>
      <div className="tx-rise tx-rise-1"><DiagnosisBanner text={data.diagnosis} /></div>
      <div className="tx-rise tx-rise-2"><SummaryCards data={data} /></div>

      {/* Friction areas */}
      {data.frictionAreas.length > 0 && (
        <section style={{ marginBottom: "48px" }} className="tx-rise tx-rise-3">
          <SectionTitle
            badge="Training priorities"
            title="Friction areas"
            subtitle="Topics where retry cost, WA density, or high attempt counts reveal training gaps — not just where you fail to solve."
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
              gap: "14px",
            }}
          >
            {data.frictionAreas.map((area) => (
              <FrictionCard key={area.tag} area={area} />
            ))}
          </div>
        </section>
      )}

      {/* Error breakdown + rating comfort zone */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: "20px",
          marginBottom: "48px",
        }}
        className="analyze-two-col tx-rise tx-rise-4"
      >
        <ErrorBreakdown data={data} />
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <RatingComfortZone data={data} />
          <StrongTopics data={data} />
        </div>
      </section>

      {/* Recommended problems */}
      {data.recommendedProblems.length > 0 && (
        <section style={{ marginBottom: "48px" }} className="tx-rise tx-rise-5">
          <SectionTitle
            badge="Retry queue"
            title="Problems to revisit"
            subtitle="Unresolved or high-retry problems from your own history, targeting your friction areas."
          />
          <RecommendedProblems data={data} />
        </section>
      )}

      {/* 7-day queue */}
      <section style={{ marginBottom: "48px" }} className="tx-rise tx-rise-6">
        <SectionTitle
          badge="7-Day plan"
          title="Your training queue"
          subtitle="Problems and focus areas selected from your friction patterns, not from a random list."
        />
        <QueueTable queue={data.sevenDayQueue} />
      </section>

      {/* v1 training engine (weakness map, daily queue, plans, weekly report) */}
      <div className="tx-rise tx-rise-6">
        <V1TrainingPanel handle={data.handle} />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .analyze-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Nav bar ──────────────────────────────────────────────────────────────────

function AnalyzeNav({ handle }: { handle: string }) {
  return (
    <nav
      style={{
        position: "sticky", top: 0, zIndex: 50,
        height: "56px",
        background: "rgba(2,8,6,0.88)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(0,245,160,0.08)",
        display: "flex", alignItems: "center",
        padding: "0 24px", gap: "16px",
        marginBottom: "32px",
      }}
    >
      <Link
        href="/"
        style={{
          display: "flex", alignItems: "center", gap: "8px",
          textDecoration: "none", color: "rgba(244,247,246,0.6)",
          fontSize: "13px", fontWeight: 500,
          transition: "color 0.15s",
        }}
      >
        <span
          style={{
            background: "linear-gradient(135deg,#00F5A0,#00D9F5)",
            borderRadius: "6px", padding: "3px 7px",
            fontSize: "11px", fontWeight: 900, color: "#020806",
            fontFamily: "var(--font-rebond, system-ui)",
          }}
        >
          SX
        </span>
        SolveX
      </Link>
      <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "14px" }}>/</span>
      <span style={{ fontSize: "13px", color: "#F4F7F6", fontWeight: 600 }}>{handle}</span>
      <div style={{ flex: 1 }} />
      <Link
        href="/"
        style={{
          fontSize: "12px", color: "#8A9A96",
          textDecoration: "none", padding: "5px 14px",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "9999px", transition: "color 0.15s, border-color 0.15s",
        }}
      >
        ← Home
      </Link>
    </nav>
  );
}

// ─── Root client component ────────────────────────────────────────────────────

export function AnalyzeContent() {
  const params = useSearchParams();
  const handle = params.get("handle")?.trim() ?? "";

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [retryDisabledUntil, setRetryDisabledUntil] = useState(0);
  const [isFromCache, setIsFromCache] = useState(false);
  const [cacheWarning, setCacheWarning] = useState("");
  // Clock state driving the retry countdown (kept in state so render stays pure)
  const [nowTs, setNowTs] = useState(0);

  // Drive the countdown display
  useEffect(() => {
    if (retryDisabledUntil === 0) return;
    const id = setInterval(() => {
      setNowTs(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [retryDisabledUntil]);

  const retrySecondsLeft =
    retryDisabledUntil > nowTs && nowTs > 0
      ? Math.ceil((retryDisabledUntil - nowTs) / 1000)
      : retryDisabledUntil > 0 && nowTs === 0
        ? 90
        : 0;

  const run = useCallback(async () => {
    if (!handle) return;
    if (Date.now() < retryDisabledUntil) return;
    setStatus("loading");
    setErrorMsg("");
    setIsFromCache(false);
    setCacheWarning("");
    try {
      // Direct call to the SolveX backend v1 compat endpoint; falls back to
      // the same-origin proxy only on network failure (see fetchLegacyAnalysis).
      const json = await fetchLegacyAnalysis(handle);
      if (json.from_cache) {
        setIsFromCache(true);
        setCacheWarning(
          json.cache_warning ??
          "Showing latest cached analysis because Codeforces is rate-limiting now."
        );
      }
      setResult(json);
      setStatus("success");
    } catch (err: unknown) {
      if (err instanceof V1ApiError) {
        if (err.isRateLimited || err.errorCode === "CODEFORCES_RATE_LIMITED") {
          setNowTs(Date.now());
          setRetryDisabledUntil(Date.now() + 90_000);
          setErrorMsg("Codeforces is rate-limiting requests. Please wait 1–2 minutes and try again.");
        } else if (err.status === 502 || err.errorCode === "CODEFORCES_UNAVAILABLE") {
          setErrorMsg("Codeforces API is temporarily unavailable. Try again later.");
        } else {
          setErrorMsg(err.message);
        }
      } else {
        setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      }
      setStatus("error");
    }
  }, [handle, retryDisabledUntil]);

  useEffect(() => {
    if (!handle) return;
    // Deferred a tick so the loading-state update isn't synchronous in the effect.
    const t = setTimeout(run, 0);
    return () => clearTimeout(t);
  }, [handle, run]);

  // ── No handle ──
  if (!handle) {
    return (
      <div
        style={{
          minHeight: "100vh", background: "#020806",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "48px 24px", textAlign: "center",
        }}
      >
        <div
          style={{
            width: "64px", height: "64px", borderRadius: "16px",
            background: "linear-gradient(135deg, #00F5A0, #00D9F5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: "22px", color: "#020806",
            marginBottom: "32px", fontFamily: "var(--font-rebond, system-ui)",
          }}
        >
          SX
        </div>
        <h1
          style={{
            fontFamily: "var(--font-rebond, system-ui)", fontWeight: 700,
            fontSize: "clamp(28px, 5vw, 44px)", color: "#F4F7F6",
            letterSpacing: "-0.04em", marginBottom: "12px",
          }}
        >
          No handle provided.
        </h1>
        <p style={{ fontSize: "16px", color: "#8A9A96", marginBottom: "32px" }}>
          Enter your Codeforces handle to analyze your profile.
        </p>
        <Link
          href="/"
          className="tx-press"
          style={{
            background: "#00F5A0", color: "#020806",
            fontSize: "15px", fontWeight: 700,
            padding: "12px 28px", borderRadius: "9999px", textDecoration: "none",
          }}
        >
          ← Enter handle
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#020806" }}>
      <AnalyzeNav handle={handle} />

      {status === "loading" && <LoadingDashboard handle={handle} />}

      {status === "error" && (
        <ErrorState
          handle={handle}
          message={errorMsg}
          onRetry={run}
          retrySecondsLeft={retrySecondsLeft}
        />
      )}

      {status === "success" && result && (
        <>
          {isFromCache && (
            <div
              style={{
                maxWidth: "1100px", margin: "0 auto 0",
                padding: "0 24px",
              }}
            >
              <div
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  background: "rgba(255,170,0,0.07)",
                  border: "1px solid rgba(255,170,0,0.28)",
                  borderRadius: "10px",
                  padding: "10px 18px",
                  marginBottom: "16px",
                  fontSize: "13px", color: "#FFCC55", lineHeight: "1.5",
                }}
              >
                <span style={{ fontSize: "16px", flexShrink: 0 }}>&#9888;</span>
                {cacheWarning}
              </div>
            </div>
          )}
          <Dashboard data={result} />
        </>
      )}
    </div>
  );
}
