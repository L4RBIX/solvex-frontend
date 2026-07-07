import type { ExecutionPayload, ExecutionResult } from "@/types/execution";

import { API_BASE } from "@/lib/apiBase";

const EXECUTE_URL = `${API_BASE}/api/execute`;

interface BackendResponse {
  status: string;
  stdout: string;
  stderr: string;
  compile_output: string;
  time_ms: number | null;
  memory_kb: number | null;
  is_mock: boolean;
  passed: boolean;
  message: string;
}

function normalize(data: BackendResponse): ExecutionResult {
  return {
    status: data.status as ExecutionResult["status"],
    stdout: data.stdout,
    stderr: data.stderr,
    compile_output: data.compile_output,
    compile_error: data.compile_output,   // backwards compat for OutputConsole
    time_ms: data.time_ms ?? undefined,
    memory_kb: data.memory_kb ?? undefined,
    is_mock: false,
    passed: data.passed,
    message: data.message || undefined,
  };
}

export async function runCode(payload: ExecutionPayload): Promise<ExecutionResult> {
  try {
    const res = await fetch(EXECUTE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(35_000),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null) as { message?: string } | null;
      const msg = body?.message ?? `Execution backend returned HTTP ${res.status}.`;
      return { status: "error", stdout: "", stderr: "", is_mock: false, message: msg };
    }

    const data = await res.json() as BackendResponse;
    return normalize(data);
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return {
        status: "error",
        stdout: "",
        stderr: "",
        is_mock: false,
        message: "Request timed out. The judge may be under load — try again.",
      };
    }
    if (err instanceof TypeError) {
      return {
        status: "error",
        stdout: "",
        stderr: "",
        is_mock: false,
        message:
          "Compiler service is not reachable. " +
          "Check that NEXT_PUBLIC_API_URL points to the deployed backend.",
      };
    }
    return {
      status: "error",
      stdout: "",
      stderr: "",
      is_mock: false,
      message: "Unexpected error during execution.",
    };
  }
}

export async function submitCode(payload: ExecutionPayload): Promise<ExecutionResult> {
  return runCode(payload);
}
