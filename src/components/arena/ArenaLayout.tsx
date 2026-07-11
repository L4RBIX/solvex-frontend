"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ArenaHeader from "./ArenaHeader";
import ArenaRightTabs, { type ArenaRightTab } from "./ArenaRightTabs";
import ProblemPanel from "./ProblemPanel";
import CodeEditor from "./CodeEditor";
import TestCasePanel from "./TestCasePanel";
import OutputConsole from "./OutputConsole";
import CopilotPanel from "./CopilotPanel";
import { DuelResultOverlay, DuelStatusBar } from "./DuelPanel";
import { runCode, submitCode } from "@/lib/executionApi";
import type { CopilotMessage } from "@/lib/copilotApi";
import type { DuelHintResponse } from "@/lib/v1Api";
import { V1ApiError, openDuelArena, requestDuelHint, submitDuel } from "@/lib/v1Api";
import { useDuelState } from "@/hooks/useDuelState";
import { useAuth } from "@/hooks/useAuth";
import SignInGate from "@/components/auth/SignInGate";
import type { ExecutionLanguage, ExecutionResult, ExecutionStatus } from "@/types/execution";
import { JUDGE0_LANGUAGE_MAP } from "@/types/execution";
import type { ArenaProblem, ArenaEvent, ArenaEventType, CodeSnapshot, TestCase } from "@/types/arena";
import type { editor } from "monaco-editor";

// ─── Sample problem ───────────────────────────────────────────────────────────

const SAMPLE_PROBLEM: ArenaProblem = {
  key: "SAMPLE",
  name: "Removals Game",
  rating: 1000,
  tags: ["constructive algorithms", "games"],
  time_limit: "2 seconds",
  memory_limit: "256 MB",
  statement:
    "Alice and Bob play a game with a pile of n stones. Players alternate turns, Alice goes first. On each turn, the current player removes either 1 or 2 stones from the pile. The player who removes the last stone wins.\n\nGiven n, determine who wins assuming both players play optimally.",
  input_format: "A single integer n (1 ≤ n ≤ 10^9) — the initial number of stones.",
  output_format: 'Print "Alice" if Alice wins, or "Bob" if Bob wins (without quotes).',
  sample_tests: [
    { input: "1", output: "Alice", note: "Alice takes the only stone and wins." },
    { input: "3", output: "Bob",   note: "Whatever Alice takes, Bob can always take the remaining stones." },
    { input: "4", output: "Alice", note: "Alice takes 1, leaving 3 for Bob. Bob is in a losing position." },
  ],
  notes:
    "The key insight: if n is divisible by 3, Bob wins; otherwise Alice wins. This is a classic Nim variant.",
  is_sample: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSampleTests(problem: ArenaProblem): TestCase[] {
  return problem.sample_tests.map((t, i) => ({
    id: `sample_${i}`,
    input: t.input,
    expected_output: t.output,
    status: "not_run" as const,
    is_sample: true,
    label: `Sample ${i + 1}`,
  }));
}

function makeId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function codeKey(problemKey: string, language: ExecutionLanguage) {
  return `sx_arena_code_${problemKey}_${language}`;
}

function snapsKey(problemKey: string) {
  return `sx_arena_snaps_${problemKey}`;
}

function loadSnaps(key: string): CodeSnapshot[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CodeSnapshot[]) : [];
  } catch {
    return [];
  }
}

function saveSnaps(key: string, snaps: CodeSnapshot[]) {
  localStorage.setItem(key, JSON.stringify(snaps.slice(-10)));
}

// ─── Component ────────────────────────────────────────────────────────────────

const DUEL_JUDGE_STATUSES: ReadonlyArray<ExecutionStatus> = [
  "accepted", "wrong_answer", "runtime_error", "time_limit", "compilation_error", "no_tests", "error",
];

function toExecutionStatus(status: string): ExecutionStatus {
  return (DUEL_JUDGE_STATUSES as string[]).includes(status) ? (status as ExecutionStatus) : "error";
}

export default function ArenaLayout() {
  const searchParams = useSearchParams();
  const problemParam = searchParams.get("problem");
  const handleParam = searchParams.get("handle") ?? undefined;
  const duelParam = searchParams.get("duel");

  // Duel mode (Phase G4.1): poll shared state every 2s; never breaks normal Arena.
  const duelAuth = useAuth();
  const duelSignedIn = duelAuth.status === "signed_in";
  const duel = useDuelState(
    duelParam && duelSignedIn ? duelParam : null,
    2000,
    duelSignedIn ? duelAuth.user?.user_id ?? null : null
  );
  const duelState = duel.state;

  const duelProblemData = duelState?.problem ?? null;
  const duelProblem: ArenaProblem | null = useMemo(
    () =>
      duelProblemData
        ? {
            key: duelProblemData.problem_id,
            name: duelProblemData.name,
            rating: duelProblemData.rating ?? 0,
            tags: duelProblemData.tags ?? [],
            time_limit: "Practice judge",
            memory_limit: "Server limits",
            statement: duelProblemData.statement_summary ?? "Task content is unavailable in SolveX.",
            input_format: duelProblemData.input_format ?? "Input format unavailable.",
            output_format: duelProblemData.output_format ?? "Output format unavailable.",
            constraints: duelProblemData.constraints ?? undefined,
            sample_tests: duelProblemData.sample_tests ?? [],
            notes: `${duelProblemData.content_notice ?? ""} ${duelState?.judging_note ?? ""}`.trim(),
            is_sample: false,
            official_url: duelProblemData.url,
          }
        : null,
    [duelProblemData, duelState?.judging_note]
  );

  const problem = duelProblem ?? SAMPLE_PROBLEM;
  const effectiveKey = duelProblem?.key ?? problemParam ?? problem.key;

  const [language, setLanguage] = useState<ExecutionLanguage>("cpp17");
  const [code, setCode] = useState<string>(() => JUDGE0_LANGUAGE_MAP.cpp17.starter_template);
  const [testCases, setTestCases] = useState<TestCase[]>(() => makeSampleTests(problem));
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<ArenaRightTab>("tests");
  const [snapshots, setSnapshots] = useState<CodeSnapshot[]>([]);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [events, setEvents] = useState<ArenaEvent[]>([]);
  // Copilot conversation state lifted here so it survives tab switches
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([]);
  const [copilotHelpLevel, setCopilotHelpLevel] = useState<number>(2);
  // Duel mode UI state
  const [duelHints, setDuelHints] = useState<DuelHintResponse[]>([]);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);
  const [resultDismissed, setResultDismissed] = useState(false);
  const duelKeyRef = useRef<string | null>(null);

  const codeRef = useRef(code);
  const prevCodeRef = useRef(code);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const sessionId = useRef(makeId());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function addEvent(type: ArenaEventType, data?: Record<string, unknown>) {
    setEvents((prev) => [
      ...prev,
      { type, timestamp: Date.now(), problem_key: effectiveKey, language, data },
    ]);
  }

  function persistSnapshot(trigger: "auto" | "run" | "submit") {
    const snap: CodeSnapshot = {
      id: makeId(),
      problem_key: effectiveKey,
      language,
      code: codeRef.current,
      timestamp: Date.now(),
      trigger,
    };
    setSnapshots((prev) => {
      const next = [...prev, snap];
      saveSnaps(snapsKey(effectiveKey), next);
      return next;
    });
    setSavedAt(Date.now());
  }

  // Load code from localStorage when problem/language changes
  useEffect(() => {
    const saved = localStorage.getItem(codeKey(effectiveKey, language));
    const template = JUDGE0_LANGUAGE_MAP[language].starter_template;
    const initial = saved ?? template;
    setCode(initial);
    codeRef.current = initial;
    prevCodeRef.current = initial;
  }, [effectiveKey, language]);

  // Load snapshots
  useEffect(() => {
    setSnapshots(loadSnaps(snapsKey(effectiveKey)));
  }, [effectiveKey]);

  // Clear Copilot chat when the problem changes
  useEffect(() => {
    setCopilotMessages([]);
  }, [effectiveKey]);

  // Save code to localStorage (debounced 1.5s)
  useEffect(() => {
    codeRef.current = code;
    const t = setTimeout(() => {
      localStorage.setItem(codeKey(effectiveKey, language), code);
    }, 1500);
    return () => clearTimeout(t);
  }, [code, effectiveKey, language]);

  // Auto-snapshot every 60s if code changed
  useEffect(() => {
    const interval = setInterval(() => {
      if (codeRef.current !== prevCodeRef.current) {
        persistSnapshot("auto");
        prevCodeRef.current = codeRef.current;
      }
    }, 60_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveKey, language]);

  // Session events
  useEffect(() => {
    addEvent("session_started", { session_id: sessionId.current, handle: handleParam });
    return () => { addEvent("session_finished"); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Duel mode: arena-open telemetry (fire and forget — never blocks the Arena).
  useEffect(() => {
    if (duelParam && duelSignedIn) void openDuelArena(duelParam).catch(() => {});
  }, [duelParam, duelSignedIn]);

  // If client navigation reuses this component while Copilot was open in the
  // normal Arena, unmount it before any duel context can reach its effects.
  useEffect(() => {
    if (duelParam && rightTab === "copilot") setRightTab("tests");
  }, [duelParam, rightTab]);

  // Public samples remain available for local Run. Ranked Submit never uses
  // these editable fields; the backend uses its hidden locked test snapshot.
  useEffect(() => {
    if (!duelProblem || duelKeyRef.current === duelProblem.key) return;
    duelKeyRef.current = duelProblem.key;
    const samples = makeSampleTests(duelProblem);
    setTestCases(samples.length > 0 ? samples : [{
        id: makeId(),
        input: "",
        expected_output: "",
        status: "not_run",
        is_sample: false,
        label: "Local test 1",
      }]);
  }, [duelProblem]);

  function handleLanguageChange(lang: ExecutionLanguage) {
    setLanguage(lang);
    addEvent("language_changed", { from: language, to: lang });
  }

  function handleCodeChange(val: string) {
    setCode(val);
    codeRef.current = val;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => addEvent("code_changed_debounced"), 2000);
  }

  const executeTest = useCallback(
    async (testId: string, trigger: "run" | "submit" = "run") => {
      const tc = testCases.find((t) => t.id === testId);
      if (!tc) return;

      setRunningId(testId);
      setTestCases((prev) =>
        prev.map((t) => (t.id === testId ? { ...t, status: "running", actual_output: undefined } : t))
      );
      setRightTab("console");
      addEvent("test_case_run", { test_id: testId });
      persistSnapshot(trigger);

      const res = await runCode({
        language,
        source_code: codeRef.current,
        stdin: tc.input,
        expected_output: tc.expected_output,
        problem_key: effectiveKey,
      });

      setResult(res);
      addEvent("result_received", { status: res.status, is_mock: res.is_mock });

      const actualOut = res.stdout ?? res.message ?? "";
      const finalStatus = res.is_mock
        ? ("not_run" as const)
        : !res.is_mock && res.status === "accepted" && actualOut.trim() === tc.expected_output.trim()
          ? ("accepted" as const)
          : res.status;

      setTestCases((prev) =>
        prev.map((t) =>
          t.id === testId ? { ...t, status: finalStatus, actual_output: actualOut } : t
        )
      );
      setRunningId(null);
      return res;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [testCases, language, effectiveKey]
  );

  async function handleRun() {
    setIsRunning(true);
    setResult(null);
    addEvent("run_clicked");
    const firstId = testCases.find((t) => t.is_sample)?.id ?? testCases[0]?.id;
    if (firstId) await executeTest(firstId, "run");
    setIsRunning(false);
  }

  async function handleRunAll() {
    setIsRunning(true);
    setResult(null);
    for (const tc of testCases) await executeTest(tc.id, "run");
    setIsRunning(false);
  }

  async function handleDuelSubmit() {
    if (!duelParam || !duelSignedIn) return;
    if (duelState?.judging_available === false) {
      setResult({
        status: "no_tests",
        stdout: "",
        stderr: "",
        is_mock: false,
        message: "Judging unavailable. This duel problem has no shared server-controlled tests. Your solution was not evaluated.",
      });
      setRightTab("console");
      return;
    }
    setIsSubmitting(true);
    setResult(null);
    addEvent("submit_clicked", { duel_id: duelParam });
    persistSnapshot("submit");
    setRightTab("console");
    try {
      const res = await submitDuel(duelParam, {
        language,
        source_code: codeRef.current,
      });
      const status = res.verdict === "no_tests" ? "no_tests" : toExecutionStatus(res.judge_status);
      setResult({
        status,
        stdout: "",
        stderr: "",
        time_ms: res.runtime_ms ?? undefined,
        memory_kb: res.memory_kb ?? undefined,
        is_mock: false,
        passed: res.passed,
        message: status === "no_tests"
          ? "Judging unavailable. This duel problem has no shared server-controlled tests. Your solution was not evaluated."
          : res.passed
          ? res.duel.status === "completed"
            ? "Custom tests passed — duel decided!"
            : "Custom tests passed! Waiting for the final verdict…"
          : res.message || res.judge_status,
      });
      addEvent("result_received", { status, is_mock: false });
      void duel.refresh();
    } catch (e) {
      const noTests = e instanceof V1ApiError && e.errorCode === "DUEL_TESTS_UNAVAILABLE";
      setResult({
        status: noTests ? "no_tests" : "error",
        stdout: "",
        stderr: "",
        is_mock: false,
        message: noTests
          ? "Judging unavailable. This duel problem has no shared server-controlled tests. Your solution was not evaluated."
          : e instanceof V1ApiError ? e.message : "Duel submit failed — check your connection and try again.",
      });
      void duel.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit() {
    if (duelParam && duelSignedIn) {
      await handleDuelSubmit();
      return;
    }
    setIsSubmitting(true);
    setResult(null);
    addEvent("submit_clicked");
    persistSnapshot("submit");
    setRightTab("console");

    const res = await submitCode({
      language,
      source_code: codeRef.current,
      stdin: testCases[0]?.input ?? "",
      problem_key: effectiveKey,
    });

    setResult(res);
    addEvent("result_received", { status: res.status, is_mock: res.is_mock });
    setIsSubmitting(false);
  }

  async function handleUseHint() {
    if (!duelParam) return;
    setHintLoading(true);
    setHintError(null);
    try {
      const hint = await requestDuelHint(duelParam);
      setDuelHints((prev) =>
        prev.some((h) => h.hint_number === hint.hint_number) ? prev : [...prev, hint]
      );
      void duel.refresh();
    } catch (e) {
      setHintError(e instanceof V1ApiError ? e.message : "Hint unavailable right now.");
    } finally {
      setHintLoading(false);
    }
  }

  function handleReset() {
    const template = JUDGE0_LANGUAGE_MAP[language].starter_template;
    setCode(template);
    codeRef.current = template;
  }

  async function handleCopy() {
    try { await navigator.clipboard.writeText(codeRef.current); } catch { /* ignore */ }
  }

  function addTestCase() {
    setTestCases((prev) => [
      ...prev,
      {
        id: makeId(),
        input: "",
        expected_output: "",
        status: "not_run",
        is_sample: false,
        label: `Custom ${prev.filter((t) => !t.is_sample).length + 1}`,
      },
    ]);
    addEvent("test_case_added");
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  const busy = isRunning || isSubmitting;
  const duelJudgingUnavailable = Boolean(duelParam && duelState?.judging_available === false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#020806",
        overflow: "hidden",
      }}
    >
      <ArenaHeader
        problemKey={duelProblem?.key ?? problemParam ?? problem.key}
        problemName={problem.name}
        language={language}
        onLanguageChange={handleLanguageChange}
        onRun={handleRun}
        onSubmit={handleSubmit}
        onReset={handleReset}
        onCopy={handleCopy}
        isRunning={isRunning}
        isSubmitting={isSubmitting}
        submitDisabled={duelJudgingUnavailable}
        submitDisabledReason={duelJudgingUnavailable ? "Judging unavailable: this duel has no shared server-controlled tests." : undefined}
        savedAt={savedAt}
        snapshotCount={snapshots.length}
      />

      {/* Duel mode: live status strip (never rendered on normal /arena) */}
      {duelParam && duelSignedIn && duelState && !duel.fatalError && (
        <DuelStatusBar
          state={duelState}
          hints={duelHints}
          onUseHint={() => { void handleUseHint(); }}
          hintLoading={hintLoading}
          hintError={hintError}
        />
      )}
      {duelParam && duelAuth.status === "signed_out" && (
        <div style={{ padding: "16px", flexShrink: 0, borderBottom: "1px solid rgba(255,170,51,0.25)", background: "rgba(255,170,51,0.06)" }}>
          <SignInGate
            onSignIn={() => void duelAuth.signIn()}
            busy={duelAuth.busy}
            error={duelAuth.error}
            title="Sign in to enter this duel"
            message="Sign in to compete; handle verification is optional. The Arena below still works for normal practice while signed out."
          />
        </div>
      )}
      {duelParam && duelSignedIn && duel.fatalError && (
        <div
          style={{
            padding: "8px 16px",
            fontSize: "12px",
            color: "#FFAA33",
            borderBottom: "1px solid rgba(255,170,51,0.25)",
            background: "rgba(255,170,51,0.06)",
            flexShrink: 0,
          }}
        >
          Duel unavailable: {duel.fatalError} — the normal Arena below still works.
        </div>
      )}

      {/* Main panels */}
      <div
        style={{
          flex: 1,
          display: "flex",
          minHeight: 0,
          overflow: "hidden",
        }}
        className="arena-panels"
      >
        {/* Problem panel — 30% */}
        <div
          style={{
            width: "30%",
            flexShrink: 0,
            borderRight: "1px solid rgba(0,245,160,0.08)",
            overflow: "hidden",
            background: "#020806",
          }}
          className="arena-problem"
        >
          <ProblemPanel problem={problem} />
        </div>

        {/* Monaco editor — flex-1 */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            borderRight: "1px solid rgba(0,245,160,0.08)",
            overflow: "hidden",
            background: "#030E08",
          }}
          className="arena-editor"
        >
          <CodeEditor
            language={language}
            value={code}
            onChange={handleCodeChange}
            onMount={(inst) => { editorRef.current = inst; }}
          />
        </div>

        {/* Right panel — 25% */}
        <div
          style={{
            width: "25%",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
          }}
          className="arena-right"
        >
          {/* Tab bar */}
          <ArenaRightTabs active={rightTab} onSelect={setRightTab} busy={busy} duelMode={Boolean(duelParam)} />

          {/* Panel content */}
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            {rightTab === "tests" ? (
              <TestCasePanel
                testCases={testCases}
                onRun={(id) => { void executeTest(id); }}
                onRunAll={handleRunAll}
                onAdd={addTestCase}
                onDelete={(id) => setTestCases((prev) => prev.filter((t) => t.id !== id))}
                onUpdate={(id, field, value) =>
                  setTestCases((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)))
                }
                isRunning={busy}
                runningId={runningId}
              />
            ) : rightTab === "console" ? (
              <OutputConsole result={result} isRunning={busy} events={events} />
            ) : duelParam ? (
              <div style={{ padding: "18px", color: "#FFAA33", fontSize: "12px" }}>
                Copilot is disabled during PvP to keep the duel fair.
              </div>
            ) : (
              <CopilotPanel
                messages={copilotMessages}
                onMessagesChange={setCopilotMessages}
                helpLevel={copilotHelpLevel}
                onHelpLevelChange={setCopilotHelpLevel}
                sessionId={sessionId.current}
                language={language}
                code={code}
                problem={problem}
                lastStatus={result?.status ?? "Idle"}
                lastStdout={result?.stdout ?? ""}
                lastStderr={result?.stderr ?? ""}
                lastCompileOutput={result?.compile_output ?? ""}
                events={events}
                verificationMode={false}
              />
            )}
          </div>
        </div>
      </div>

      {/* Duel result: win/lose/draw overlay with animation */}
      {duelParam && duelSignedIn && !duel.fatalError && duelState?.result && !resultDismissed && (
        <DuelResultOverlay state={duelState} onDismiss={() => setResultDismissed(true)} />
      )}

      {/* Responsive styles */}
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 1023px) {
          .arena-panels { flex-direction: column !important; overflow-y: auto !important; }
          .arena-problem { width: 100% !important; height: 200px; border-right: none !important; border-bottom: 1px solid rgba(0,245,160,0.08); }
          .arena-editor  { width: 100% !important; height: 320px; flex: none !important; border-right: none !important; border-bottom: 1px solid rgba(0,245,160,0.08); }
          .arena-right   { width: 100% !important; height: 360px; }
        }
        .sm-show { display: flex !important; }
        .md-show { display: flex !important; }
        .md-show-flex { display: flex !important; }
        @media (max-width: 640px) { .sm-show { display: none !important; } .md-show { display: none !important; } .md-show-flex { display: none !important; } }
        @media (max-width: 900px) { .md-show { display: none !important; } .md-show-flex { display: none !important; } }
      `}</style>
    </div>
  );
}
