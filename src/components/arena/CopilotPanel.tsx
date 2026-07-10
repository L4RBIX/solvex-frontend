"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot, Send, Lightbulb, Bug, AlertCircle, Layers, X,
  Trash2, Zap, CheckCircle, TrendingUp, Target, Brain, RefreshCw, ChevronDown,
} from "lucide-react";
import { askCopilot, buildProblemContext, buildRecentEvents } from "@/lib/copilotApi";
import type { CopilotMode, CopilotMessage } from "@/lib/copilotApi";
import { getOrCreateAnonKey, getCoachProfile, updateCoachProfile, STYLE_LABELS, ERROR_LABELS } from "@/lib/coachApi";
import type { CoachProfile } from "@/lib/coachApi";
import type { ExecutionLanguage, ExecutionStatus } from "@/types/execution";
import type { ArenaProblem, ArenaEvent } from "@/types/arena";
import { useAuth } from "@/hooks/useAuth";
import { getApiToken } from "@/lib/v1Api";

// ─── Props ────────────────────────────────────────────────────────────────────

interface CopilotPanelProps {
  // Lifted state from ArenaLayout (survives tab switches)
  messages: CopilotMessage[];
  onMessagesChange: React.Dispatch<React.SetStateAction<CopilotMessage[]>>;
  helpLevel: number;
  onHelpLevelChange: (level: number) => void;
  // Arena context
  sessionId: string;
  language: ExecutionLanguage;
  code: string;
  problem: ArenaProblem;
  lastStatus: ExecutionStatus | string;
  lastStdout: string;
  lastStderr: string;
  lastCompileOutput: string;
  lastInput?: string;
  lastExpectedOutput?: string;
  lastActualOutput?: string;
  events: ArenaEvent[];
  verificationMode?: boolean;
}

// ─── Quick actions ────────────────────────────────────────────────────────────

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  text: string;
  mode: CopilotMode;
  helpLevel: number;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Small hint",     icon: Lightbulb,   text: "Give me a small hint",              mode: "hint",            helpLevel: 1 },
  { label: "Explain error",  icon: AlertCircle, text: "Explain the error",                 mode: "error_explain",   helpLevel: 3 },
  { label: "Find bug",       icon: Bug,         text: "Find the bug in my code",           mode: "debug",           helpLevel: 3 },
  { label: "Edge cases",     icon: Layers,      text: "What edge cases am I missing?",     mode: "debug",           helpLevel: 2 },
  { label: "Check approach", icon: Target,      text: "Is my approach correct?",           mode: "approach_review", helpLevel: 2 },
  { label: "Optimize",       icon: TrendingUp,  text: "How can I optimize this?",          mode: "optimize",        helpLevel: 3 },
];

const HELP_LEVEL_LABELS: Record<number, string> = {
  1: "Tiny hint",
  2: "Conceptual",
  3: "Debug guide",
  4: "Detailed",
  5: "Full solution",
};

// ─── localStorage helpers ─────────────────────────────────────────────────────

const CONSENT_KEY = "sx_copilot_consent";
const AUTO_ANALYZE_KEY = "sx_copilot_auto_analyze";

function loadBool(key: string): boolean {
  try { return localStorage.getItem(key) === "true"; } catch { return false; }
}
function saveBool(key: string, v: boolean) {
  try { localStorage.setItem(key, String(v)); } catch { /* ignore */ }
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Minimal markdown renderer (bold + inline code) ──────────────────────────

function renderMarkdown(text: string): React.ReactNode[] {
  return text.split("\n").map((line, li) => {
    const parts: React.ReactNode[] = [];
    let rem = line;
    let k = 0;

    while (rem.length > 0) {
      const ci = rem.indexOf("`");
      const bi = rem.indexOf("**");
      if (ci === -1 && bi === -1) { parts.push(<span key={k++}>{rem}</span>); break; }
      const useCode = ci !== -1 && (bi === -1 || ci < bi);
      if (useCode) {
        if (ci > 0) parts.push(<span key={k++}>{rem.slice(0, ci)}</span>);
        const end = rem.indexOf("`", ci + 1);
        if (end === -1) { parts.push(<span key={k++}>{rem.slice(ci)}</span>); break; }
        parts.push(
          <code key={k++} style={{ fontFamily: "ui-monospace,monospace", fontSize: "11px", background: "rgba(0,245,160,0.1)", padding: "1px 4px", borderRadius: "3px", color: "#00F5A0" }}>
            {rem.slice(ci + 1, end)}
          </code>
        );
        rem = rem.slice(end + 1);
      } else {
        if (bi > 0) parts.push(<span key={k++}>{rem.slice(0, bi)}</span>);
        const end = rem.indexOf("**", bi + 2);
        if (end === -1) { parts.push(<span key={k++}>{rem.slice(bi)}</span>); break; }
        parts.push(<strong key={k++} style={{ color: "#F4F7F6", fontWeight: 600 }}>{rem.slice(bi + 2, end)}</strong>);
        rem = rem.slice(end + 2);
      }
    }

    return (
      <span key={li} style={{ display: "block", minHeight: line ? undefined : "8px" }}>
        {parts}
      </span>
    );
  });
}

// ─── Error → mode mapping ─────────────────────────────────────────────────────

function getAutoMode(status: string): { mode: CopilotMode; helpLevel: number; text: string } {
  const s = status.toLowerCase().replace(/ /g, "_");
  if (s.includes("compilation") || s.includes("compile")) {
    return { mode: "error_explain", helpLevel: 3, text: "Explain this compilation error" };
  }
  if (s.includes("runtime")) {
    return { mode: "debug", helpLevel: 3, text: "Why is there a runtime error?" };
  }
  if (s.includes("wrong_answer") || s.includes("wrong answer")) {
    return { mode: "debug", helpLevel: 2, text: "Why is my output wrong? What edge case am I missing?" };
  }
  if (s.includes("time_limit") || s.includes("tle")) {
    return { mode: "optimize", helpLevel: 3, text: "How can I optimize this to avoid TLE?" };
  }
  return { mode: "debug", helpLevel: 3, text: "What went wrong?" };
}

function getErrorSuggestion(status: string): string | null {
  const s = status.toLowerCase().replace(/ /g, "_");
  if (s.includes("compilation") || s.includes("compile")) return "Compilation error detected. Ask Copilot to explain?";
  if (s.includes("runtime"))                                return "Runtime error detected. Ask Copilot to find the bug?";
  if (s.includes("wrong_answer") || s.includes("wrong answer")) return "Wrong Answer detected. Ask Copilot for edge cases?";
  if (s.includes("time_limit") || s.includes("tle"))        return "Time Limit Exceeded. Ask Copilot to help optimize?";
  return null;
}

function isErrorStatus(status: string): boolean {
  const s = status.toLowerCase().replace(/ /g, "_");
  return (
    s.includes("compilation") || s.includes("runtime") ||
    s.includes("wrong_answer") || s.includes("wrong answer") ||
    s.includes("time_limit")
  );
}

// ─── Evidence badge ───────────────────────────────────────────────────────────
//
// Shows whether a Copilot claim is backed by real execution or is unverified
// model reasoning — see CopilotEvidenceType. Fixes a production bug where
// Copilot stated a correct solution was wrong with a fabricated, unexecuted
// counterexample.

function evidenceBadge(evidenceType?: string): { label: string; color: string; bg: string; border: string } | null {
  switch (evidenceType) {
    case "compile_error":
    case "runtime_error":
    case "verified_test_failure":
    case "verified_counterexample":
      return { label: "Execution verified", color: "#00F5A0", bg: "rgba(0,245,160,0.08)", border: "rgba(0,245,160,0.25)" };
    case "speculative_review":
      return { label: "Unverified — code review only", color: "#FFAA33", bg: "rgba(255,170,51,0.08)", border: "rgba(255,170,51,0.3)" };
    default:
      return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CopilotPanel({
  messages,
  onMessagesChange,
  helpLevel,
  onHelpLevelChange,
  sessionId,
  language,
  code,
  problem,
  lastStatus,
  lastStdout,
  lastStderr,
  lastCompileOutput,
  lastInput = "",
  lastExpectedOutput = "",
  lastActualOutput = "",
  events,
  verificationMode = false,
}: CopilotPanelProps) {
  const auth = useAuth();
  const coachAccountId = auth.status === "signed_in" ? auth.user?.user_id ?? null : null;
  // Per-panel transient state (fine to reset on remount)
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState<boolean>(() => loadBool(CONSENT_KEY));
  const [autoAnalyze, setAutoAnalyze] = useState<boolean>(() => loadBool(AUTO_ANALYZE_KEY));
  const [errorSuggestion, setErrorSuggestion] = useState<string | null>(null);

  // ── Coach Memory ────────────────────────────────────────────────────────────
  const [anonUserKey] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return getOrCreateAnonKey();
  });
  const [coachExpanded, setCoachExpanded] = useState(false);
  const [coachProfileState, setCoachProfileState] = useState<{
    accountId: string;
    profile: CoachProfile | null;
  } | null>(null);
  const coachProfile = coachProfileState?.accountId === coachAccountId ? coachProfileState.profile : null;
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachLoadedAccount, setCoachLoadedAccount] = useState<string | null>(null);
  const coachLoaded = coachLoadedAccount === coachAccountId;

  async function loadCoachProfile() {
    const requestedAccount = coachAccountId;
    const requestedToken = getApiToken();
    if (!anonUserKey || !requestedAccount || coachLoading) return;
    setCoachLoading(true);
    const profile = await getCoachProfile(anonUserKey);
    if (getApiToken() !== requestedToken) return;
    setCoachProfileState({ accountId: requestedAccount, profile });
    setCoachLoadedAccount(requestedAccount);
    setCoachLoading(false);
  }

  async function handleUpdateCoach() {
    const requestedAccount = coachAccountId;
    const requestedToken = getApiToken();
    if (!anonUserKey || !requestedAccount || coachLoading) return;
    setCoachLoading(true);
    const profile = await updateCoachProfile(anonUserKey);
    if (getApiToken() !== requestedToken) return;
    setCoachProfileState({ accountId: requestedAccount, profile });
    setCoachLoadedAccount(requestedAccount);
    setCoachLoading(false);
  }

  // Load profile lazily when the card is first expanded
  useEffect(() => {
    if (coachExpanded && !coachLoaded && anonUserKey && coachAccountId) {
      void loadCoachProfile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachExpanded, coachAccountId]);

  const prevStatusRef = useRef<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Watch for new error statuses
  useEffect(() => {
    const prev = prevStatusRef.current;
    if (
      lastStatus !== prev &&
      lastStatus &&
      lastStatus !== "not_run" &&
      lastStatus !== "running" &&
      lastStatus !== "Idle"
    ) {
      if (isErrorStatus(lastStatus)) {
        if (autoAnalyze) {
          const { mode, helpLevel: hl, text } = getAutoMode(lastStatus);
          void sendWithConfig(text, mode, hl);
        } else {
          setErrorSuggestion(getErrorSuggestion(lastStatus));
        }
      } else {
        setErrorSuggestion(null);
      }
      prevStatusRef.current = lastStatus;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastStatus, autoAnalyze]);

  function handleConsentChange(v: boolean) {
    setConsent(v);
    saveBool(CONSENT_KEY, v);
  }

  function handleAutoAnalyzeChange(v: boolean) {
    setAutoAnalyze(v);
    saveBool(AUTO_ANALYZE_KEY, v);
  }

  const sendWithConfig = useCallback(
    async (text: string, mode: CopilotMode, hl: number) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      onMessagesChange((prev) => [
        ...prev,
        { id: makeId(), role: "user", content: trimmed, ts: Date.now(), mode },
      ]);
      setInput("");
      setError(null);
      setErrorSuggestion(null);
      setLoading(true);

      const result = await askCopilot({
        session_id: sessionId,
        message: trimmed,
        mode,
        help_level: hl,
        consent_for_training: consent,
        anonymous_user_key: anonUserKey || undefined,
        problem: buildProblemContext(problem),
        editor: { language, source_code: code },
        execution: {
          last_status: lastStatus || "Idle",
          last_stdout: lastStdout,
          last_stderr: lastStderr,
          last_compile_output: lastCompileOutput,
          last_input: lastInput,
          last_expected_output: lastExpectedOutput,
          last_actual_output: lastActualOutput,
        },
        recent_events: buildRecentEvents(events),
      });

      setLoading(false);

      if (result.error) {
        setError(result.error);
        return;
      }

      onMessagesChange((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content: result.message,
          ts: Date.now(),
          suggestedNextAction: result.suggested_next_action ?? undefined,
          evidenceType: result.evidence_type,
          verifiedWrong: result.verified_wrong,
        },
      ]);
    },
    [
      loading, sessionId, consent, anonUserKey, problem, language, code,
      lastStatus, lastStdout, lastStderr, lastCompileOutput,
      lastInput, lastExpectedOutput, lastActualOutput, events,
      onMessagesChange,
    ]
  );

  const send = useCallback(
    (text: string) => sendWithConfig(text, "general", helpLevel),
    [sendWithConfig, helpLevel]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  // ─── Verification mode ──────────────────────────────────────────────────────

  if (verificationMode) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: "12px" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bot size={20} style={{ color: "#FF7A96" }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#F4F7F6", marginBottom: "6px" }}>Copilot Disabled</div>
          <div style={{ fontSize: "11px", color: "#5A7A70", lineHeight: "16px", maxWidth: "200px" }}>
            Copilot is disabled during Verification Challenges to protect skill integrity.
          </div>
        </div>
      </div>
    );
  }

  // ─── Context status pills ───────────────────────────────────────────────────

  const hasCode = code.trim().length > 0;
  const hasError = lastStderr.trim().length > 0 || lastCompileOutput.trim().length > 0;
  const hasRun = !!lastStatus && lastStatus !== "Idle" && lastStatus !== "not_run";

  const contextPills = [
    { label: "Problem", active: !!problem.name },
    { label: "Code",    active: hasCode },
    { label: "Error",   active: hasError },
    { label: "Run",     active: hasRun },
  ];

  const isEmpty = messages.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Context status bar */}
      <div style={{
        flexShrink: 0,
        display: "flex",
        gap: "4px",
        padding: "7px 12px",
        borderBottom: "1px solid rgba(0,245,160,0.06)",
        flexWrap: "wrap",
        alignItems: "center",
      }}>
        {contextPills.map(({ label, active }) => (
          <span
            key={label}
            style={{
              display: "inline-flex", alignItems: "center", gap: "3px",
              padding: "2px 7px", borderRadius: "10px", fontSize: "9.5px", fontWeight: 500,
              background: active ? "rgba(0,245,160,0.08)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${active ? "rgba(0,245,160,0.25)" : "rgba(255,255,255,0.06)"}`,
              color: active ? "#00F5A0" : "#3A5A4A",
            }}
          >
            {active && <CheckCircle size={8} style={{ flexShrink: 0 }} />}
            {label}
          </span>
        ))}
        {messages.length > 0 && (
          <button
            type="button"
            title="Clear chat"
            onClick={() => { onMessagesChange([]); setError(null); setErrorSuggestion(null); }}
            style={{ marginLeft: "auto", background: "none", border: "none", color: "#3A5A4A", cursor: "pointer", display: "flex", alignItems: "center", padding: "2px" }}
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>

      {/* Coach Memory card */}
      <div style={{
        flexShrink: 0,
        borderBottom: "1px solid rgba(0,245,160,0.06)",
        background: "rgba(0,217,245,0.02)",
      }}>
        {/* Header row — always visible */}
        <div style={{
          display: "flex", alignItems: "center", gap: "5px",
          padding: "5px 12px",
          cursor: "pointer",
        }}
          onClick={() => setCoachExpanded(!coachExpanded)}
        >
          <Brain size={11} style={{ color: "#00D9F5", flexShrink: 0 }} />
          <span style={{ fontSize: "10px", fontWeight: 600, color: "#4A7A8A", flex: 1 }}>
            Coach Memory
          </span>
          <button
            type="button"
            title="Update coach memory"
            onClick={(e) => { e.stopPropagation(); void handleUpdateCoach(); }}
            disabled={coachLoading || !coachAccountId}
            style={{
              background: "none", border: "none", padding: "2px 4px",
              color: coachLoading || !coachAccountId ? "#2A4A5A" : "#3A7A8A",
              cursor: coachLoading || !coachAccountId ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center",
            }}
          >
            <RefreshCw size={10} style={{ animation: coachLoading ? "spin 1s linear infinite" : undefined }} />
          </button>
          <ChevronDown
            size={11}
            style={{
              color: "#3A5A6A", flexShrink: 0,
              transform: coachExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.15s",
            }}
          />
        </div>

        {/* Expanded content */}
        {coachExpanded && (
          <div style={{ padding: "0 12px 8px" }}>
            {!coachAccountId ? (
              <button
                type="button"
                onClick={() => void auth.signIn()}
                disabled={auth.busy}
                style={{
                  width: "100%", padding: "6px 8px", borderRadius: "6px",
                  border: "1px solid rgba(0,217,245,0.2)", background: "rgba(0,217,245,0.05)",
                  color: "#7AC8D8", fontSize: "10px", cursor: auth.busy ? "wait" : "pointer",
                }}
              >
                {auth.busy ? "Signing in…" : "Sign in to use private Coach Memory"}
              </button>
            ) : coachLoading ? (
              <div style={{ fontSize: "10px", color: "#3A5A6A" }}>Updating profile…</div>
            ) : coachProfile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {coachProfile.common_error_patterns?.[0] && (
                  <div style={{ fontSize: "10px", color: "#7AC8D8" }}>
                    <span style={{ color: "#3A5A6A" }}>Common: </span>
                    {ERROR_LABELS[coachProfile.common_error_patterns[0].type] ?? coachProfile.common_error_patterns[0].type}
                    {coachProfile.common_error_patterns[0].count >= 2
                      ? ` (${coachProfile.common_error_patterns[0].count}×)` : ""}
                  </div>
                )}
                {(coachProfile.weak_tags?.length ?? 0) > 0 && (
                  <div style={{ fontSize: "10px", color: "#7AC8D8" }}>
                    <span style={{ color: "#3A5A6A" }}>Weak tags: </span>
                    {coachProfile.weak_tags!.slice(0, 3).join(", ")}
                  </div>
                )}
                {coachProfile.preferred_help_style && (
                  <div style={{ fontSize: "10px", color: "#7AC8D8" }}>
                    <span style={{ color: "#3A5A6A" }}>Style: </span>
                    {STYLE_LABELS[coachProfile.preferred_help_style] ?? coachProfile.preferred_help_style}
                  </div>
                )}
                {coachProfile.preferred_language && coachProfile.preferred_language !== "english" && (
                  <div style={{ fontSize: "10px", color: "#7AC8D8" }}>
                    <span style={{ color: "#3A5A6A" }}>Language: </span>
                    {coachProfile.preferred_language.charAt(0).toUpperCase() + coachProfile.preferred_language.slice(1)}
                  </div>
                )}
                {!coachProfile.common_error_patterns?.length &&
                  !coachProfile.weak_tags?.length && (
                  <div style={{ fontSize: "10px", color: "#3A5A6A" }}>
                    No patterns yet — solve more problems.
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: "10px", color: "#3A5A6A" }}>
                No profile yet. Click ↻ to build from recent sessions.
              </div>
            )}
            <div style={{
              marginTop: "5px", fontSize: "9.5px", color: "#2A4A5A", lineHeight: "13px",
              borderTop: "1px solid rgba(0,217,245,0.07)", paddingTop: "4px",
            }}>
              SolveX uses your solving history to personalise Copilot. Training-data sharing is off unless enabled.
            </div>
          </div>
        )}
      </div>

      {/* Welcome / empty state */}
      {isEmpty && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "12px 12px 0", gap: "12px", overflowY: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", paddingTop: "8px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "linear-gradient(135deg, rgba(0,245,160,0.15), rgba(0,217,245,0.15))",
              border: "1px solid rgba(0,245,160,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Bot size={18} style={{ color: "#00F5A0" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#F4F7F6", marginBottom: "3px" }}>SolveX Copilot</div>
              <div style={{ fontSize: "10.5px", color: "#5A7A70", lineHeight: "15px" }}>
                Context-aware. Hints first. Not a solution machine.
              </div>
            </div>
          </div>

          {/* Help level selector */}
          <div>
            <div style={{ fontSize: "9.5px", color: "#3A5A4A", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Help level</div>
            <div style={{ display: "flex", gap: "3px" }}>
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onHelpLevelChange(lvl)}
                  title={HELP_LEVEL_LABELS[lvl]}
                  style={{
                    flex: 1, padding: "4px 2px", borderRadius: "5px",
                    border: `1px solid ${helpLevel === lvl ? "rgba(0,245,160,0.4)" : "rgba(0,245,160,0.1)"}`,
                    background: helpLevel === lvl ? "rgba(0,245,160,0.12)" : "rgba(0,245,160,0.03)",
                    color: helpLevel === lvl ? "#00F5A0" : "#3A5A4A",
                    fontSize: "10px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <div style={{ fontSize: "9.5px", color: "#3A5A4A", marginTop: "3px", textAlign: "center" }}>
              {HELP_LEVEL_LABELS[helpLevel]}
            </div>
          </div>

          {/* Quick actions */}
          <div>
            <div style={{ fontSize: "9.5px", color: "#3A5A4A", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Quick actions</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
              {QUICK_ACTIONS.map(({ label, icon: Icon, text, mode, helpLevel: hl }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => void sendWithConfig(text, mode, hl)}
                  disabled={loading}
                  style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    padding: "6px 8px", borderRadius: "7px",
                    border: "1px solid rgba(0,245,160,0.1)", background: "rgba(0,245,160,0.03)",
                    color: "#7A9A90", fontSize: "10px", fontWeight: 500,
                    cursor: "pointer", textAlign: "left", transition: "border-color 0.15s, background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0,245,160,0.3)";
                    e.currentTarget.style.background = "rgba(0,245,160,0.07)";
                    e.currentTarget.style.color = "#00F5A0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0,245,160,0.1)";
                    e.currentTarget.style.background = "rgba(0,245,160,0.03)";
                    e.currentTarget.style.color = "#7A9A90";
                  }}
                >
                  <Icon size={10} style={{ flexShrink: 0, color: "rgba(0,245,160,0.4)" }} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Message list */}
      {!isEmpty && (
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px 0", display: "flex", flexDirection: "column", gap: "10px" }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: "flex", gap: "7px", alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
              <div style={{
                flexShrink: 0, width: "22px", height: "22px", borderRadius: "6px",
                background: msg.role === "assistant"
                  ? "linear-gradient(135deg, rgba(0,245,160,0.2), rgba(0,217,245,0.2))"
                  : "rgba(255,255,255,0.05)",
                border: msg.role === "assistant" ? "1px solid rgba(0,245,160,0.2)" : "1px solid rgba(255,255,255,0.07)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {msg.role === "assistant"
                  ? <Bot size={11} style={{ color: "#00F5A0" }} />
                  : <span style={{ fontSize: "9px", color: "#8A9A96" }}>U</span>}
              </div>
              <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", gap: "3px" }}>
                {msg.role === "assistant" && evidenceBadge(msg.evidenceType) && (
                  <span style={{
                    alignSelf: "flex-start",
                    display: "inline-flex", alignItems: "center", gap: "4px",
                    padding: "2px 7px", borderRadius: "10px", fontSize: "9.5px", fontWeight: 700,
                    background: evidenceBadge(msg.evidenceType)!.bg,
                    border: `1px solid ${evidenceBadge(msg.evidenceType)!.border}`,
                    color: evidenceBadge(msg.evidenceType)!.color,
                  }}>
                    {evidenceBadge(msg.evidenceType)!.label}
                  </span>
                )}
                <div style={{
                  padding: "7px 10px",
                  borderRadius: msg.role === "user" ? "10px 4px 10px 10px" : "4px 10px 10px 10px",
                  background: msg.role === "user" ? "rgba(0,245,160,0.07)" : "rgba(255,255,255,0.04)",
                  border: msg.role === "user" ? "1px solid rgba(0,245,160,0.14)" : "1px solid rgba(255,255,255,0.06)",
                  fontSize: "11.5px", lineHeight: "18px",
                  color: msg.role === "user" ? "#D4EDE5" : "#C8D4D0",
                }}>
                  {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
                </div>
                {msg.suggestedNextAction && (
                  <div style={{
                    padding: "4px 8px", borderRadius: "6px",
                    background: "rgba(0,217,245,0.05)", border: "1px solid rgba(0,217,245,0.12)",
                    fontSize: "10px", color: "#5A9AB0",
                    display: "flex", alignItems: "center", gap: "5px",
                  }}>
                    <Zap size={9} style={{ flexShrink: 0, color: "#00D9F5" }} />
                    {msg.suggestedNextAction}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading bubble */}
          {loading && (
            <div style={{ display: "flex", gap: "7px", alignItems: "flex-start" }}>
              <div style={{
                flexShrink: 0, width: "22px", height: "22px", borderRadius: "6px",
                background: "linear-gradient(135deg, rgba(0,245,160,0.2), rgba(0,217,245,0.2))",
                border: "1px solid rgba(0,245,160,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Bot size={11} style={{ color: "#00F5A0" }} />
              </div>
              <div style={{
                padding: "7px 12px", borderRadius: "4px 10px 10px 10px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                display: "flex", gap: "4px", alignItems: "center",
              }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{
                    width: "5px", height: "5px", borderRadius: "50%",
                    background: "#00F5A0", opacity: 0.6,
                    animation: `cp-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* Compact help level selector (shown while chatting) */}
          {!loading && (
            <div style={{ display: "flex", gap: "3px", padding: "2px 0 4px" }}>
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  title={HELP_LEVEL_LABELS[lvl]}
                  onClick={() => onHelpLevelChange(lvl)}
                  style={{
                    padding: "2px 6px", borderRadius: "4px",
                    border: `1px solid ${helpLevel === lvl ? "rgba(0,245,160,0.35)" : "rgba(0,245,160,0.08)"}`,
                    background: helpLevel === lvl ? "rgba(0,245,160,0.1)" : "transparent",
                    color: helpLevel === lvl ? "#00F5A0" : "#3A5A4A",
                    fontSize: "9.5px", fontWeight: 600, cursor: "pointer",
                  }}
                >
                  {lvl}
                </button>
              ))}
              <span style={{ fontSize: "9.5px", color: "#3A5A4A", alignSelf: "center", marginLeft: "3px" }}>
                {HELP_LEVEL_LABELS[helpLevel]}
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div style={{
          margin: "6px 12px 0", padding: "7px 10px", flexShrink: 0,
          background: "rgba(255,77,109,0.07)", border: "1px solid rgba(255,77,109,0.18)",
          borderRadius: "7px", fontSize: "10.5px", color: "#FF7A96",
          display: "flex", alignItems: "flex-start", gap: "6px",
        }}>
          <AlertCircle size={11} style={{ flexShrink: 0, marginTop: "1px" }} />
          <span style={{ flex: 1 }}>{error}</span>
          <button type="button" onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#FF7A96", cursor: "pointer", padding: 0 }}>
            <X size={11} />
          </button>
        </div>
      )}

      {/* Error suggestion banner */}
      {errorSuggestion && !loading && (
        <div style={{
          margin: "6px 12px 0", padding: "7px 10px", flexShrink: 0,
          background: "rgba(0,217,245,0.05)", border: "1px solid rgba(0,217,245,0.15)",
          borderRadius: "7px", fontSize: "10.5px", color: "#7AC8D8",
          display: "flex", alignItems: "center", gap: "6px",
        }}>
          <Zap size={10} style={{ flexShrink: 0, color: "#00D9F5" }} />
          <span style={{ flex: 1 }}>{errorSuggestion}</span>
          <button
            type="button"
            onClick={() => {
              const { mode, helpLevel: hl, text } = getAutoMode(lastStatus);
              void sendWithConfig(text, mode, hl);
            }}
            style={{
              background: "rgba(0,217,245,0.12)", border: "1px solid rgba(0,217,245,0.25)",
              borderRadius: "5px", color: "#00D9F5", fontSize: "9.5px", fontWeight: 600,
              cursor: "pointer", padding: "2px 7px", flexShrink: 0,
            }}
          >
            Ask
          </button>
          <button type="button" onClick={() => setErrorSuggestion(null)} style={{ background: "none", border: "none", color: "#3A7A8A", cursor: "pointer", padding: 0 }}>
            <X size={10} />
          </button>
        </div>
      )}

      {/* Toggles row */}
      <div style={{ flexShrink: 0, padding: "6px 12px 0", display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{
          padding: "5px 9px", background: "rgba(0,217,245,0.03)", border: "1px solid rgba(0,217,245,0.07)",
          borderRadius: "6px", display: "flex", alignItems: "center", gap: "7px",
        }}>
          <button
            type="button" role="switch" aria-checked={autoAnalyze}
            onClick={() => handleAutoAnalyzeChange(!autoAnalyze)}
            style={{
              flexShrink: 0, width: "26px", height: "14px", borderRadius: "7px",
              background: autoAnalyze ? "rgba(0,217,245,0.35)" : "rgba(255,255,255,0.07)",
              border: autoAnalyze ? "1px solid rgba(0,217,245,0.5)" : "1px solid rgba(255,255,255,0.09)",
              position: "relative", cursor: "pointer", transition: "background 0.2s, border-color 0.2s",
            }}
          >
            <span style={{
              position: "absolute", top: "2px", left: autoAnalyze ? "12px" : "2px",
              width: "8px", height: "8px", borderRadius: "50%",
              background: autoAnalyze ? "#00D9F5" : "rgba(255,255,255,0.25)",
              transition: "left 0.2s",
            }} />
          </button>
          <span style={{ fontSize: "10px", color: "#4A7A8A", lineHeight: "14px" }}>
            Auto-analyze errors with Copilot
          </span>
        </div>

        <div style={{
          padding: "5px 9px", background: "rgba(0,245,160,0.02)", border: "1px solid rgba(0,245,160,0.07)",
          borderRadius: "6px", display: "flex", alignItems: "center", gap: "7px",
        }}>
          <button
            type="button" role="switch" aria-checked={consent}
            onClick={() => handleConsentChange(!consent)}
            style={{
              flexShrink: 0, width: "26px", height: "14px", borderRadius: "7px",
              background: consent ? "rgba(0,245,160,0.35)" : "rgba(255,255,255,0.07)",
              border: consent ? "1px solid rgba(0,245,160,0.5)" : "1px solid rgba(255,255,255,0.09)",
              position: "relative", cursor: "pointer", transition: "background 0.2s, border-color 0.2s",
            }}
          >
            <span style={{
              position: "absolute", top: "2px", left: consent ? "12px" : "2px",
              width: "8px", height: "8px", borderRadius: "50%",
              background: consent ? "#00F5A0" : "rgba(255,255,255,0.25)",
              transition: "left 0.2s",
            }} />
          </button>
          <span style={{ fontSize: "10px", color: "#4A7A60", lineHeight: "14px" }}>
            Allow Copilot data to improve AI
          </span>
        </div>
      </div>

      {/* Input row */}
      <div style={{ padding: "7px 12px 12px", flexShrink: 0 }}>
        <div
          style={{
            display: "flex", gap: "5px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(0,245,160,0.11)",
            borderRadius: "10px",
            padding: "5px 7px 5px 10px",
            transition: "border-color 0.15s",
          }}
          onFocusCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,245,160,0.28)"; }}
          onBlurCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,245,160,0.11)"; }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your code…"
            disabled={loading}
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              resize: "none", color: "#C8D4D0", fontSize: "12px", lineHeight: "19px",
              fontFamily: "inherit", overflowY: "hidden", minHeight: "19px", maxHeight: "96px",
            }}
          />
          <button
            type="button"
            onClick={() => void send(input)}
            disabled={loading || !input.trim()}
            style={{
              flexShrink: 0, alignSelf: "flex-end",
              width: "27px", height: "27px", borderRadius: "7px", border: "none",
              background: input.trim() && !loading ? "rgba(0,245,160,0.18)" : "rgba(255,255,255,0.03)",
              color: input.trim() && !loading ? "#00F5A0" : "#2A4A3A",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            <Send size={11} />
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: "4px", fontSize: "9.5px", color: "#1A3A2A" }}>
          Shift+Enter for new line · Enter to send
        </div>
      </div>

      <style>{`
        @keyframes cp-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
