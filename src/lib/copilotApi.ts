import type { ExecutionLanguage } from "@/types/execution";
import type { ArenaProblem, ArenaEvent } from "@/types/arena";
import { API_BASE } from "@/lib/apiBase";
import { getAccessToken } from "@/lib/supabaseClient";

const COPILOT_URL = `${API_BASE}/api/copilot`;

// ─── Shared message type (exported so ArenaLayout can lift this state) ───────

// Evidence classification for a Copilot correctness claim — see backend
// contestiq_api/routes/copilot.py EVIDENCE_* constants. Anything other than
// verified_test_failure/verified_counterexample/compile_error/runtime_error
// means no real execution backs the claim.
export type CopilotEvidenceType =
  | "compile_error"
  | "runtime_error"
  | "verified_test_failure"
  | "verified_counterexample"
  | "speculative_review"
  | "no_verified_failure";

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
  mode?: CopilotMode;
  suggestedNextAction?: string;
  evidenceType?: CopilotEvidenceType;
  verifiedWrong?: boolean;
}

// ─── Mode types ───────────────────────────────────────────────────────────────

export type CopilotMode =
  | "hint"
  | "debug"
  | "error_explain"
  | "approach_review"
  | "optimize"
  | "general";

// ─── Nested context shapes ────────────────────────────────────────────────────

export interface CopilotProblemContext {
  id?: string;
  contest_id?: number;
  index?: string;
  title?: string;
  statement?: string;
  input?: string;
  output?: string;
  examples?: Array<{ input: string; output: string; note?: string }>;
  tags?: string[];
  rating?: number;
}

export interface CopilotEditorContext {
  language: ExecutionLanguage;
  source_code: string;
  cursor_line?: number;
  selected_text?: string;
}

export interface CopilotExecutionContext {
  last_status: string;
  last_stdout?: string;
  last_stderr?: string;
  last_compile_output?: string;
  last_input?: string;
  last_expected_output?: string;
  last_actual_output?: string;
}

export interface CopilotRecentEvent {
  type: string;
  timestamp?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
}

// ─── Request / response ───────────────────────────────────────────────────────

export interface CopilotPayload {
  session_id?: string;
  message: string;
  mode: CopilotMode;
  help_level: number;
  consent_for_training: boolean;
  anonymous_user_key?: string;
  problem?: CopilotProblemContext;
  editor: CopilotEditorContext;
  execution: CopilotExecutionContext;
  recent_events?: CopilotRecentEvent[];
}

export interface CopilotResult {
  status?: string;
  message: string;
  session_id: string;
  model: string;
  suggested_next_action?: string;
  detected_issue_type?: string;
  evidence_type?: CopilotEvidenceType;
  verified_wrong?: boolean;
  error?: string;
}

// ─── API call ─────────────────────────────────────────────────────────────────

export async function askCopilot(payload: CopilotPayload): Promise<CopilotResult> {
  try {
    const token = await getAccessToken();
    const res = await fetch(COPILOT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(35_000),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null) as { message?: string; error?: string } | null;
      const msg = body?.message ?? body?.error ?? `Copilot backend returned HTTP ${res.status}.`;
      return { message: "", session_id: payload.session_id ?? "", model: "", error: msg };
    }

    return await res.json() as CopilotResult;
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return { message: "", session_id: "", model: "", error: "Request timed out. Please try again." };
    }
    if (err instanceof TypeError) {
      return {
        message: "",
        session_id: "",
        model: "",
        error: "Cannot reach the backend. Check that NEXT_PUBLIC_API_URL is set correctly in your deployment.",
      };
    }
    return { message: "", session_id: "", model: "", error: "Unexpected error contacting Copilot." };
  }
}

// ─── Context builders ─────────────────────────────────────────────────────────

export function buildProblemContext(problem: ArenaProblem): CopilotProblemContext {
  return {
    title: problem.name,
    statement: problem.statement,
    tags: problem.tags,
    rating: problem.rating,
    // Pass sample tests so the backend can verify code against them
    examples: problem.sample_tests.map((t) => ({
      input: t.input,
      output: t.output,
      ...(t.note ? { note: t.note } : {}),
    })),
  };
}

export function buildRecentEvents(events: ArenaEvent[]): CopilotRecentEvent[] {
  return events.slice(-10).map((e) => ({
    type: e.type,
    timestamp: new Date(e.timestamp).toISOString(),
    summary: e.data ? JSON.stringify(e.data).slice(0, 100) : undefined,
  }));
}
