"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Terminal, FlaskConical, Bot } from "lucide-react";
import ArenaHeader from "./ArenaHeader";
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

type RightTab = "tests" | "console" | "copilot";

const DUEL_JUDGE_STATUSES: ReadonlyArray<ExecutionStatus> = [
  "accepted", "wrong_answer", "runtime_error", "time_limit", "compilation_error", "error",
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
  const duel = useDuelState(duelParam, handleParam, 2000);
  const duelState = duel.state;

  const duelProblemData = duelState?.problem ?? null;
  const duelJudgingNote = duelState?.judging_note ?? "";
  const duelProblem: ArenaProblem | null = useMemo(
    () =>
      duelProblemData
        ? {
            key: duelProblemData.problem_id,
            name: duelProblemData.name,
            rating: duelProblemData.rating ?? 0,
            tags: duelProblemData.tags ?? [],
            time_limit: "see Codeforces",
            memory_limit: "see Codeforces",
            statement:
              `Duel problem: ${duelProblemData.name}. SolveX does not store official Codeforces statements — ` +
              `open the problem on Codeforces (link above) to read it.\n\n${duelJudgingNote}`,
            input_format: "See the official statement on Codeforces.",
            output_format: "See the official statement on Codeforces.",
            sample_tests: [],
            notes:
              "Add a test case (input + expected output from the statement's samples), write your solution, " +
              "and Submit. Whoever submits first locks that test as the shared one both players are judged " +
              "against. First to pass the shared custom test wins — if both pass, fewer hints, then earlier pass, " +
              "then fewer wrong attempts.",
            is_sample: false,
          }
        : null,
    [duelProblemData, duelJudgingNote]
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
  const [rightTab, setRightTab] = useState<RightTab>("tests");
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
  const sharedTestPrefilledRef = useRef(false);

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
    if (duelParam) void openDuelArena(duelParam, handleParam).catch(() => {});
  }, [duelParam, handleParam]);

  // Duel mode: when the duel problem loads, start from one empty custom test —
  // the player copies a sample from the official statement.
  useEffect(() => {
    if (!duelProblem || duelKeyRef.current === duelProblem.key) return;
    duelKeyRef.current = duelProblem.key;
    sharedTestPrefilledRef.current = false;
    setTestCases([
      {
        id: makeId(),
        input: "",
        expected_output: "",
        status: "not_run",
        is_sample: false,
        label: "Duel test 1",
      },
    ]);
  }, [duelProblem]);

  // Duel mode: once the shared test is locked (server-controlled — see
  // duels.py _lock_shared_test), prefill it once so the second player codes
  // against the SAME input/expected output they'll actually be judged on,
  // instead of typing a different one that gets silently overridden.
  useEffect(() => {
    if (!duelState?.shared_test || sharedTestPrefilledRef.current) return;
    sharedTestPrefilledRef.current = true;
    const shared = duelState.shared_test;
    setTestCases((prev) =>
      prev.length > 0
        ? prev.map((t, i) => (i === 0 ? { ...t, input: shared.input, expected_output: shared.expected_output } : t))
        : [{
            id: makeId(),
            input: shared.input,
            expected_output: shared.expected_output,
            status: "not_run",
            is_sample: false,
            label: "Shared duel test",
          }]
    );
  }, [duelState?.shared_test]);

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
    if (!duelParam) return;
    const tc = testCases.find((t) => t.expected_output.trim());
    if (!tc) {
      setResult({
        status: "error",
        stdout: "",
        stderr: "",
        is_mock: false,
        message:
          "Duel judging needs a test: add input + expected output (copy a sample from the official statement), then Submit.",
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
      const res = await submitDuel(
        duelParam,
        {
          language,
          source_code: codeRef.current,
          stdin: tc.input,
          expected_output: tc.expected_output,
        },
        handleParam
      );
      const status = toExecutionStatus(res.judge_status);
      setResult({
        status,
        stdout: "",
        stderr: "",
        time_ms: res.runtime_ms ?? undefined,
        memory_kb: res.memory_kb ?? undefined,
        is_mock: false,
        passed: res.passed,
        message: res.passed
          ? res.duel.status === "completed"
            ? "Custom tests passed — duel decided!"
            : "Custom tests passed! Waiting for the final verdict…"
          : res.message || res.judge_status,
      });
      addEvent("result_received", { status, is_mock: false });
      setTestCases((prev) => prev.map((t) => (t.id === tc.id ? { ...t, status } : t)));
      void duel.refresh();
    } catch (e) {
      setResult({
        status: "error",
        stdout: "",
        stderr: "",
        is_mock: false,
        message: e instanceof V1ApiError ? e.message : "Duel submit failed — check your connection and try again.",
      });
      void duel.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit() {
    if (duelParam) {
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
      const hint = await requestDuelHint(duelParam, handleParam);
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
        savedAt={savedAt}
        snapshotCount={snapshots.length}
      />

      {/* Duel mode: live status strip (never rendered on normal /arena) */}
      {duelParam && duelState && (
        <DuelStatusBar
          state={duelState}
          hints={duelHints}
          onUseHint={() => { void handleUseHint(); }}
          hintLoading={hintLoading}
          hintError={hintError}
        />
      )}
      {duelParam && duel.fatalError && (
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid rgba(0,245,160,0.08)",
              background: "#020806",
              flexShrink: 0,
            }}
          >
            {([
              { id: "tests" as RightTab,   Icon: FlaskConical, label: "Tests" },
              { id: "console" as RightTab, Icon: Terminal,     label: "Console" },
              { id: "copilot" as RightTab, Icon: Bot,          label: "Copilot" },
            ] as const).map(({ id, Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setRightTab(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "10px 14px",
                  fontSize: "11px",
                  fontFamily: "ui-monospace, monospace",
                  background: "none",
                  border: "none",
                  borderBottom: rightTab === id ? "2px solid #00F5A0" : "2px solid transparent",
                  color: rightTab === id ? "#00F5A0" : "#3A5A4A",
                  cursor: "pointer",
                  transition: "color 0.15s",
                  marginBottom: "-1px",
                }}
              >
                <Icon size={11} />
                {label}
                {id === "console" && busy && (
                  <span
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: "#00D9F5",
                      animation: "pulse 1.2s ease-in-out infinite",
                    }}
                  />
                )}
              </button>
            ))}
          </div>

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
      {duelParam && duelState?.result && !resultDismissed && (
        <DuelResultOverlay
          state={duelState}
          handle={handleParam ?? ""}
          onDismiss={() => setResultDismissed(true)}
        />
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
