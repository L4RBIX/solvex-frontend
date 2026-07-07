"use client";

/**
 * SolveX v1 training engine panel: evidence-based weakness map, daily queue,
 * plans, and weekly report from the /api/v1 backend, with server-enforced
 * free/premium shaping rendered honestly (locked skills, limited queue,
 * gated 14-day plan, gated weekly report).
 */

import { useCallback, useEffect, useState } from "react";
import {
  V1ApiError,
  WeaknessResponse,
  QueueResponse,
  PlanResponse,
  WeeklyReportResponse,
  analyzeWeakness,
  getApiToken,
  getDailyQueue,
  getMyEntitlements,
  getPlan,
  getWeeklyReport,
  setApiToken,
  syncHandle,
} from "@/lib/v1Api";

const COLORS = {
  bg: "#06100D",
  border: "#12271E",
  text: "#F4F7F6",
  muted: "#8A9A96",
  mint: "#00F5A0",
  cyan: "#00D9F5",
  orange: "#f97316",
  red: "#FF4D6D",
};

const STATUS_COLORS: Record<string, string> = {
  likely_weakness: COLORS.red,
  possible_weakness: COLORS.orange,
  historical_weakness_recent_improvement: COLORS.cyan,
  underexposed: COLORS.cyan,
  strength: COLORS.mint,
  likely_strength: COLORS.mint,
  maintenance_needed: COLORS.muted,
  calibration_needed: COLORS.muted,
  insufficient_evidence: COLORS.muted,
};

function statusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

function problemUrl(problemId: string): string | null {
  const match = problemId.match(/^(\d+)([A-Z][0-9]?)$/i);
  if (!match) return null;
  return `https://codeforces.com/problemset/problem/${match[1]}/${match[2]}`;
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "14px",
        padding: "16px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function LockCard({ label, hint }: { label: string; hint?: string }) {
  return (
    <Card style={{ borderStyle: "dashed", opacity: 0.85 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span aria-hidden style={{ fontSize: "16px" }}>🔒</span>
        <div>
          <div style={{ color: COLORS.text, fontWeight: 600, fontSize: "14px" }}>{label}</div>
          <div style={{ color: COLORS.muted, fontSize: "12px" }}>
            {hint ?? "Unlock with a SolveX Premium token."}
          </div>
        </div>
      </div>
    </Card>
  );
}

function PanelTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ margin: "28px 0 14px" }}>
      <h3
        style={{
          fontFamily: "var(--font-rebond, system-ui)",
          fontWeight: 700,
          fontSize: "18px",
          color: COLORS.text,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h3>
      {subtitle && <p style={{ fontSize: "13px", color: COLORS.muted, marginTop: "4px" }}>{subtitle}</p>}
    </div>
  );
}

export function V1TrainingPanel({ handle }: { handle: string }) {
  const [tokenInput, setTokenInput] = useState("");
  const [plan, setPlan] = useState<string>("free");
  const [phase, setPhase] = useState<"idle" | "syncing" | "analyzing" | "queueing" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [weakness, setWeakness] = useState<WeaknessResponse | null>(null);
  const [queue, setQueue] = useState<QueueResponse | null>(null);
  const [plan7, setPlan7] = useState<PlanResponse | null>(null);
  const [plan14, setPlan14] = useState<PlanResponse | null>(null);
  const [plan14Gate, setPlan14Gate] = useState("");
  const [weekly, setWeekly] = useState<WeeklyReportResponse | null>(null);
  const [weeklyGate, setWeeklyGate] = useState("");

  const refreshPlan = useCallback(async () => {
    try {
      const me = await getMyEntitlements();
      setPlan(me.plan);
    } catch {
      setPlan("free");
    }
  }, []);

  useEffect(() => {
    // localStorage is client-only: hydrate the token after mount (a lazy
    // useState initializer would mismatch the server-rendered value).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTokenInput(getApiToken());
    refreshPlan();
  }, [refreshPlan]);

  const saveToken = async () => {
    setApiToken(tokenInput);
    await refreshPlan();
    // Server-shaped responses depend on the plan — clear stale views.
    setWeakness(null);
    setQueue(null);
    setPlan7(null);
    setPlan14(null);
    setPlan14Gate("");
    setWeekly(null);
    setWeeklyGate("");
    setPhase("idle");
  };

  const runV1 = useCallback(async () => {
    setError("");
    setPlan14Gate("");
    setWeeklyGate("");
    try {
      setPhase("syncing");
      await syncHandle(handle);
      setPhase("analyzing");
      setWeakness(await analyzeWeakness(handle));
      setPhase("queueing");
      setQueue(await getDailyQueue(handle));
      try {
        setPlan7(await getPlan(handle, "7-day"));
      } catch {
        setPlan7(null); // plan generation is best-effort here
      }
      setPhase("done");
    } catch (err) {
      setError(err instanceof V1ApiError ? err.message : "The SolveX backend could not be reached.");
      setPhase("error");
    }
  }, [handle]);

  const loadPlan14 = async () => {
    setPlan14Gate("");
    try {
      setPlan14(await getPlan(handle, "14-day"));
    } catch (err) {
      if (err instanceof V1ApiError && err.isPremiumGate) {
        setPlan14Gate("The 14-day plan is a Premium feature. Enter your Premium token above to unlock it.");
      } else {
        setPlan14Gate(err instanceof Error ? err.message : "Could not load the 14-day plan.");
      }
    }
  };

  const loadWeekly = async () => {
    setWeeklyGate("");
    try {
      setWeekly(await getWeeklyReport(handle));
    } catch (err) {
      if (err instanceof V1ApiError && err.isPremiumGate) {
        setWeeklyGate("The weekly progress report is a Premium feature. Enter your Premium token above to unlock it.");
      } else {
        setWeeklyGate(err instanceof Error ? err.message : "Could not load the weekly report.");
      }
    }
  };

  const busy = phase === "syncing" || phase === "analyzing" || phase === "queueing";

  return (
    <section style={{ marginTop: "56px", borderTop: `1px solid ${COLORS.border}`, paddingTop: "40px" }}>
      <div style={{ marginBottom: "20px" }}>
        <div className="section-badge" style={{ marginBottom: "12px" }}>Training engine</div>
        <h2
          style={{
            fontFamily: "var(--font-rebond, system-ui)", fontWeight: 700,
            fontSize: "clamp(22px, 3vw, 28px)", color: COLORS.text, letterSpacing: "-0.03em",
          }}
        >
          Evidence-based training (v1)
        </h2>
        <p style={{ fontSize: "14px", color: COLORS.muted, marginTop: "6px" }}>
          Deep analysis on problem episodes with a daily queue and training plans. Free tier shows a
          preview; Premium unlocks everything.
        </p>
      </div>

      {/* Token + plan row */}
      <Card style={{ marginBottom: "18px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
          <span
            style={{
              padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 700,
              background: plan === "free" ? "rgba(138,154,150,0.15)" : "rgba(0,245,160,0.15)",
              color: plan === "free" ? COLORS.muted : COLORS.mint,
              textTransform: "uppercase", letterSpacing: "0.04em",
            }}
          >
            {plan.replaceAll("_", " ")}
          </span>
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Premium API token (optional)"
            autoComplete="off"
            style={{
              flex: "1 1 220px", minWidth: "180px", padding: "8px 12px", fontSize: "13px",
              background: "#020806", color: COLORS.text,
              border: `1px solid ${COLORS.border}`, borderRadius: "8px", outline: "none",
            }}
          />
          <button
            onClick={saveToken}
            style={{
              padding: "8px 14px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              background: "transparent", color: COLORS.mint,
              border: `1px solid ${COLORS.mint}`, borderRadius: "8px",
            }}
          >
            Save token
          </button>
          <button
            onClick={runV1}
            disabled={busy}
            style={{
              padding: "8px 16px", fontSize: "13px", fontWeight: 700,
              cursor: busy ? "default" : "pointer",
              background: busy ? "rgba(0,245,160,0.25)" : COLORS.mint,
              color: busy ? COLORS.muted : "#020806",
              border: "none", borderRadius: "8px",
            }}
          >
            {phase === "syncing" && "Syncing Codeforces…"}
            {phase === "analyzing" && "Analyzing episodes…"}
            {phase === "queueing" && "Building queue…"}
            {!busy && (phase === "done" ? "Re-run deep analysis" : "Run deep analysis")}
          </button>
        </div>
        <p style={{ fontSize: "11px", color: COLORS.muted, marginTop: "8px" }}>
          Tokens are issued by the SolveX team with Premium access and stored only in this browser.
        </p>
      </Card>

      {error && (
        <Card style={{ borderColor: COLORS.red, marginBottom: "18px" }}>
          <span style={{ color: COLORS.red, fontSize: "13px" }}>{error}</span>
        </Card>
      )}

      {/* Weakness map */}
      {weakness && (
        <>
          <PanelTitle
            title="Skill evidence map"
            subtitle={`${weakness.episode_count} problem episodes analyzed · global rating anchor ${weakness.global_rating}`}
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "12px" }}>
            {weakness.skills.map((skill) => (
              <Card key={skill.skill_id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }}>
                  <span style={{ color: COLORS.text, fontWeight: 700, fontSize: "14px" }}>
                    {skill.skill_id.replaceAll("_", " ").replaceAll(".", " → ")}
                  </span>
                  <span style={{ color: STATUS_COLORS[skill.status] ?? COLORS.muted, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>
                    {statusLabel(skill.status)}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "14px", margin: "8px 0", fontSize: "12px", color: COLORS.muted }}>
                  <span>severity {skill.severity}</span>
                  <span>confidence {Math.round(skill.confidence * 100)}%</span>
                  {skill.estimated_skill_rating !== null && <span>~{skill.estimated_skill_rating}</span>}
                </div>
                <p style={{ fontSize: "12px", color: COLORS.muted, lineHeight: 1.5 }}>{skill.explanation}</p>
              </Card>
            ))}
            {(weakness.locked_skills_count ?? 0) > 0 && (
              <LockCard
                label={`${weakness.locked_skills_count} more skills`}
                hint="Premium unlocks the full weakness map."
              />
            )}
          </div>
        </>
      )}

      {/* Daily queue */}
      {queue && (
        <>
          <PanelTitle
            title="Today's queue"
            subtitle={queue.items.length ? `Queue for ${queue.queue_date}` : "No candidates available yet — sync more history first."}
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "12px" }}>
            {queue.items.map((item) =>
              item.locked ? (
                <LockCard key={`locked-${item.slot}`} label={`Slot ${item.slot} · ${statusLabel(item.mode)}`} hint="Premium unlocks the full daily queue." />
              ) : (
                <Card key={item.item_id ?? item.slot}>
                  <div style={{ fontSize: "11px", color: COLORS.cyan, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>
                    Slot {item.slot} · {statusLabel(item.mode)}
                  </div>
                  <div style={{ color: COLORS.text, fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>
                    {item.problem_id && problemUrl(item.problem_id) ? (
                      <a href={problemUrl(item.problem_id)!} target="_blank" rel="noreferrer" style={{ color: COLORS.text, textDecoration: "underline" }}>
                        {item.problem_name ?? item.problem_id}
                      </a>
                    ) : (
                      item.problem_name ?? item.problem_id
                    )}
                    {item.problem_rating != null && (
                      <span style={{ color: COLORS.muted, fontWeight: 500, fontSize: "12px" }}> · {item.problem_rating}</span>
                    )}
                  </div>
                  {item.why_selected && (
                    <p style={{ fontSize: "12px", color: COLORS.muted, lineHeight: 1.5 }}>{item.why_selected}</p>
                  )}
                </Card>
              )
            )}
          </div>
        </>
      )}

      {/* Plans */}
      {plan7 && (
        <>
          <PanelTitle title="7-day plan" subtitle={`Starts ${plan7.start_date}`} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "12px" }}>
            {plan7.days.map((day) =>
              day.locked ? (
                <LockCard key={day.day_number} label={`Day ${day.day_number} · ${day.theme}`} hint={`${day.item_count ?? 0} problems · Premium`} />
              ) : (
                <Card key={day.day_number}>
                  <div style={{ fontSize: "11px", color: COLORS.mint, fontWeight: 700, marginBottom: "6px" }}>
                    DAY {day.day_number}
                  </div>
                  <div style={{ color: COLORS.text, fontWeight: 600, fontSize: "13px", marginBottom: "8px" }}>{day.theme}</div>
                  {day.items.map((item) => (
                    <div key={item.item_id ?? item.slot} style={{ fontSize: "12px", color: COLORS.muted, marginBottom: "4px" }}>
                      • {item.problem_id}
                      {item.problem_rating != null ? ` (${item.problem_rating})` : ""} — {statusLabel(item.mode)}
                    </div>
                  ))}
                </Card>
              )
            )}
          </div>
        </>
      )}

      {phase === "done" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "24px" }}>
          {!plan14 && (
            <button
              onClick={loadPlan14}
              style={{
                padding: "8px 14px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                background: "transparent", color: COLORS.cyan,
                border: `1px solid ${COLORS.cyan}`, borderRadius: "8px",
              }}
            >
              Load 14-day plan
            </button>
          )}
          {!weekly && (
            <button
              onClick={loadWeekly}
              style={{
                padding: "8px 14px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                background: "transparent", color: COLORS.cyan,
                border: `1px solid ${COLORS.cyan}`, borderRadius: "8px",
              }}
            >
              Load weekly report
            </button>
          )}
        </div>
      )}

      {plan14Gate && <LockCard label="14-day plan" hint={plan14Gate} />}
      {plan14 && (
        <>
          <PanelTitle title="14-day plan" subtitle={`Starts ${plan14.start_date}`} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "12px" }}>
            {plan14.days.map((day) => (
              <Card key={day.day_number}>
                <div style={{ fontSize: "11px", color: COLORS.mint, fontWeight: 700, marginBottom: "6px" }}>DAY {day.day_number}</div>
                <div style={{ color: COLORS.text, fontWeight: 600, fontSize: "13px", marginBottom: "8px" }}>{day.theme}</div>
                {day.items.map((item) => (
                  <div key={item.item_id ?? item.slot} style={{ fontSize: "12px", color: COLORS.muted, marginBottom: "4px" }}>
                    • {item.problem_id}
                    {item.problem_rating != null ? ` (${item.problem_rating})` : ""} — {statusLabel(item.mode)}
                  </div>
                ))}
              </Card>
            ))}
          </div>
        </>
      )}

      {weeklyGate && <div style={{ marginTop: "16px" }}><LockCard label="Weekly progress report" hint={weeklyGate} /></div>}
      {weekly && (
        <>
          <PanelTitle title="Weekly progress report" subtitle={`Week of ${weekly.week_start}`} />
          <Card>
            {weekly.status === "first_report_baseline" ? (
              <p style={{ fontSize: "13px", color: COLORS.muted }}>
                First report — this week sets your baseline. Next week&apos;s report will show changes.
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "14px" }}>
                <div>
                  <div style={{ color: COLORS.mint, fontWeight: 700, fontSize: "13px", marginBottom: "6px" }}>
                    Improvements ({weekly.improvements.length})
                  </div>
                  {weekly.improvements.slice(0, 5).map((entry) => (
                    <div key={entry.skill_id} style={{ fontSize: "12px", color: COLORS.muted }}>
                      {entry.skill_id}: {statusLabel(entry.from_status)} → {statusLabel(entry.to_status)}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ color: COLORS.orange, fontWeight: 700, fontSize: "13px", marginBottom: "6px" }}>
                    Watch ({weekly.regressions.length})
                  </div>
                  {weekly.regressions.slice(0, 5).map((entry) => (
                    <div key={entry.skill_id} style={{ fontSize: "12px", color: COLORS.muted }}>
                      {entry.skill_id}: {statusLabel(entry.from_status)} → {statusLabel(entry.to_status)}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ color: COLORS.cyan, fontWeight: 700, fontSize: "13px", marginBottom: "6px" }}>
                    Next week focus
                  </div>
                  {weekly.next_week_focus.map((entry) => (
                    <div key={entry.skill_id} style={{ fontSize: "12px", color: COLORS.muted }}>
                      {entry.skill_id} (severity {entry.severity})
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p style={{ fontSize: "11px", color: COLORS.muted, marginTop: "12px" }}>{weekly.safe_interpretation}</p>
          </Card>
        </>
      )}
    </section>
  );
}
