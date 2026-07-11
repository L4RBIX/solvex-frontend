export type ExecutionLanguage = "cpp17" | "python3";

export interface Judge0LanguageConfig {
  language_id: number;
  name: string;
  display_name: string;
  monaco_language: string;
  starter_template: string;
}

export const JUDGE0_LANGUAGE_MAP: Record<ExecutionLanguage, Judge0LanguageConfig> = {
  cpp17: {
    language_id: 54, // C++ (GCC 9.2.0)
    name: "cpp17",
    display_name: "C++17",
    monaco_language: "cpp",
    starter_template: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    return 0;
}
`,
  },
  python3: {
    language_id: 71, // Python (3.8.1)
    name: "python3",
    display_name: "Python 3",
    monaco_language: "python",
    starter_template: `import sys
input = sys.stdin.readline

def solve():
    pass

if __name__ == "__main__":
    solve()
`,
  },
};

export type ExecutionStatus =
  | "not_run"
  | "running"
  | "accepted"
  | "wrong_answer"
  | "runtime_error"
  | "time_limit"
  | "compilation_error"
  | "no_tests"
  | "error";

export interface ExecutionPayload {
  language: ExecutionLanguage;
  source_code: string;
  stdin: string;
  expected_output?: string;
  problem_key?: string;
}

export interface ExecutionResult {
  status: ExecutionStatus;
  stdout?: string;
  stderr?: string;
  compile_output?: string;  // from backend
  compile_error?: string;   // backwards-compat alias (same value)
  time_ms?: number;
  memory_kb?: number;
  exit_code?: number;
  is_mock: boolean;
  passed?: boolean;
  message?: string;
}
