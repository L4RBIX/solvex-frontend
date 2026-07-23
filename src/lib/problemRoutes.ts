import type { ExecutionLanguage } from "@/types/execution";

const PROBLEM_ID_PATTERN = /^([1-9]\d*)([A-Za-z][A-Za-z0-9]*)$/;

export function normalizeProblemId(rawProblemId: string): string | null {
  const candidate = rawProblemId.trim();
  if (!candidate || candidate.length > 32) return null;
  const match = PROBLEM_ID_PATTERN.exec(candidate);
  if (!match) return null;
  return `${Number(match[1])}${match[2].toUpperCase()}`;
}

export function problemIdFromParts(
  contestId?: number,
  index?: string
): string | null {
  if (!Number.isSafeInteger(contestId) || (contestId ?? 0) <= 0 || !index) {
    return null;
  }
  return normalizeProblemId(`${contestId}${index}`);
}

export function arenaProblemHref(
  problemId: string,
  handle?: string
): string | null {
  const normalized = normalizeProblemId(problemId);
  if (!normalized) return null;
  const params = new URLSearchParams({ problem: normalized });
  const normalizedHandle = handle?.trim();
  if (normalizedHandle) params.set("handle", normalizedHandle);
  return `/arena?${params.toString()}`;
}

export function codeforcesProblemHref(problemId: string): string | null {
  const normalized = normalizeProblemId(problemId);
  if (!normalized) return null;
  const match = PROBLEM_ID_PATTERN.exec(normalized);
  if (!match) return null;
  return `https://codeforces.com/problemset/problem/${Number(match[1])}/${match[2]}`;
}

export function soloArenaDraftKey(
  problemId: string,
  language: ExecutionLanguage
): string {
  const normalized = normalizeProblemId(problemId);
  if (!normalized) {
    throw new Error("A normalized Codeforces problem ID is required for a solo draft.");
  }
  return `solvex:arena:draft:${normalized}:${language}`;
}
