import type { ExecutionLanguage, ExecutionStatus } from "./execution";

export type ArenaEventType =
  | "session_started"
  | "language_changed"
  | "code_changed_debounced"
  | "run_clicked"
  | "submit_clicked"
  | "test_case_added"
  | "test_case_run"
  | "result_received"
  | "session_finished";

export interface ArenaEvent {
  type: ArenaEventType;
  timestamp: number;
  problem_key?: string;
  language?: ExecutionLanguage;
  data?: Record<string, unknown>;
}

export interface ArenaSession {
  session_id: string;
  problem_key: string;
  handle?: string;
  started_at: number;
  events: ArenaEvent[];
}

export interface CodeSnapshot {
  id: string;
  problem_key: string;
  language: ExecutionLanguage;
  code: string;
  timestamp: number;
  trigger: "auto" | "run" | "submit";
}

export interface TestCase {
  id: string;
  input: string;
  expected_output: string;
  actual_output?: string;
  status: ExecutionStatus;
  is_sample: boolean;
  label: string;
}

export interface ArenaProblem {
  key: string;
  name: string;
  rating: number;
  tags: string[];
  time_limit: string;
  memory_limit: string;
  statement: string;
  input_format: string;
  output_format: string;
  constraints?: string;
  sample_tests: Array<{ input: string; output: string; note?: string }>;
  notes?: string;
  is_sample: boolean;
  official_url?: string | null;
}
