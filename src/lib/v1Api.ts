/**
 * Typed client for the SolveX backend /api/v1 endpoints.
 *
 * - Base URL comes from NEXT_PUBLIC_API_URL (see apiBase.ts).
 * - Premium users paste their API token (issued by the SolveX team); it is
 *   stored in localStorage and sent as `Authorization: Bearer …`.
 *   Admin keys are NEVER used from the browser.
 * - Anonymous calls are valid and resolve to the free tier server-side.
 */

import { API_BASE } from "@/lib/apiBase";
import type { AnalysisResult } from "@/lib/cfAnalysis";

const TOKEN_KEY = "solvex_api_token";

// ─── Token storage ────────────────────────────────────────────────────────────

export function getApiToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_KEY) ?? "";
}

export function setApiToken(token: string): void {
  if (typeof window === "undefined") return;
  if (token.trim()) window.localStorage.setItem(TOKEN_KEY, token.trim());
  else window.localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getApiToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export class V1ApiError extends Error {
  status: number;
  errorCode: string;

  constructor(status: number, errorCode: string, message: string) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
  }

  get isPremiumGate(): boolean {
    return this.status === 402;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

async function v1Fetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new V1ApiError(
      res.status,
      (body as { error_code?: string }).error_code ?? `HTTP_${res.status}`,
      (body as { message?: string; error?: string }).message ??
        (body as { error?: string }).error ??
        `Request failed (HTTP ${res.status})`
    );
  }
  return body as T;
}

// ─── Types (mirror backend v1 responses) ─────────────────────────────────────

export interface WeaknessEvidence {
  episodes: number;
  weighted_episodes: number;
  solved: number;
  avg_failed_before_ac: number;
  rating_band: string;
  recent_window_days: number;
  taxonomy_quality: number;
}

export interface WeaknessSkill {
  skill_id: string;
  status: string;
  confidence: number;
  severity: number;
  underexposure: number;
  estimated_skill_rating: number | null;
  estimated_skill_rating_low: number | null;
  estimated_skill_rating_high: number | null;
  evidence: WeaknessEvidence;
  warnings: string[];
  explanation: string;
}

export interface WeaknessResponse {
  run_id: string;
  handle: string;
  global_rating: number;
  episode_count: number;
  data_cutoff_time: number | null;
  run_warnings: string[];
  skills: WeaknessSkill[];
  /** Present on the free tier: number of skills hidden behind premium. */
  locked_skills_count?: number;
  plan?: string;
  upgrade_hint?: string;
}

export interface QueueItem {
  item_id?: string;
  slot: number;
  mode: string;
  problem_id?: string;
  problem_name?: string;
  skill_id?: string;
  target_rating?: number;
  problem_rating?: number | null;
  quality_score?: number;
  final_score?: number;
  why_selected?: string;
  item_status?: string;
  /** Present on free-tier placeholder items. */
  locked?: boolean;
}

export interface QueueResponse {
  run_id: string;
  queue_date: string;
  recent_struggle: number;
  warnings: string[];
  items: QueueItem[];
  reused?: boolean;
  plan?: string;
  upgrade_hint?: string;
}

export interface PlanDay {
  day_number: number;
  theme: string;
  items: QueueItem[];
  locked?: boolean;
  item_count?: number;
}

export interface PlanResponse {
  plan_id: string;
  plan_type: string;
  start_date: string;
  days: PlanDay[];
  plan?: string;
  upgrade_hint?: string;
}

export interface WeeklyReportResponse {
  handle: string;
  week_start: string;
  status: string;
  episode_count: number;
  episode_count_change: number | null;
  improvements: { skill_id: string; from_status: string; to_status: string }[];
  regressions: { skill_id: string; from_status: string; to_status: string }[];
  still_needs_work: { skill_id: string }[];
  next_week_focus: { skill_id: string; status: string; severity: number }[];
  safe_interpretation: string;
}

export interface EntitlementsResponse {
  user: { user_id: string; handle: string | null; role: string } | null;
  plan: string;
  features: Record<string, unknown>;
}

export interface SyncResponse {
  job: { id?: string; status: string; sync_type?: string; stats?: Record<string, number | string | boolean> };
  reused?: boolean;
}

// ─── Gamification (Phase G1) ─────────────────────────────────────────────────
//
// Lightweight retention layer (XP, levels, streak, daily goal, badges) derived
// server-side from real training actions only — no leaderboard, no duels, no
// social comparison, no payment/admin data ever appears here.

export interface GamificationLevelProgress {
  current_level_xp: number;
  next_level_xp: number;
  progress_percent: number;
}

export interface GamificationStreak {
  current: number;
  longest: number;
  last_active_date: string | null;
  today_completed: boolean;
}

export interface GamificationDailyGoalItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface GamificationDailyGoal {
  date: string;
  completed: boolean;
  completed_count: number;
  required_count: number;
  items: GamificationDailyGoalItem[];
}

export interface GamificationBadge {
  id: string;
  name: string;
  description: string;
  earned_at: string;
}

export interface GamificationSnapshot {
  subject: string;
  plan: string;
  xp_total: number;
  level: number;
  level_progress: GamificationLevelProgress;
  streak: GamificationStreak;
  daily_goal: GamificationDailyGoal;
  badges: GamificationBadge[];
}

export function getGamification(handle?: string): Promise<GamificationSnapshot> {
  const query = handle ? `?handle=${encodeURIComponent(handle)}` : "";
  return v1Fetch<GamificationSnapshot>(`/api/v1/gamification/me${query}`);
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export function getMyEntitlements(): Promise<EntitlementsResponse> {
  return v1Fetch<EntitlementsResponse>("/api/v1/me/entitlements");
}

export function syncHandle(handle: string): Promise<SyncResponse> {
  return v1Fetch<SyncResponse>(`/api/v1/sync/codeforces/${encodeURIComponent(handle)}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function analyzeWeakness(handle: string): Promise<WeaknessResponse> {
  return v1Fetch<WeaknessResponse>(`/api/v1/weakness/${encodeURIComponent(handle)}/analyze`, {
    method: "POST",
  });
}

export function getDailyQueue(handle: string): Promise<QueueResponse> {
  return v1Fetch<QueueResponse>("/api/v1/recommendations/daily", {
    method: "POST",
    body: JSON.stringify({ handle }),
  });
}

export function getPlan(handle: string, planType: "7-day" | "14-day"): Promise<PlanResponse> {
  return v1Fetch<PlanResponse>(`/api/v1/plans/${planType}`, {
    method: "POST",
    body: JSON.stringify({ handle }),
  });
}

export function getWeeklyReport(handle: string): Promise<WeeklyReportResponse> {
  return v1Fetch<WeeklyReportResponse>(`/api/v1/weekly-report/${encodeURIComponent(handle)}`);
}

/**
 * Legacy-shape analysis for the existing dashboard, served by the backend
 * (/api/v1/compat). Falls back to the same-origin Next.js proxy only when the
 * direct call fails at the network level (e.g. CORS/base URL misconfig), so a
 * broken env var does not blank the page.
 */
export async function fetchLegacyAnalysis(
  handle: string
): Promise<AnalysisResult & { from_cache?: boolean; cache_warning?: string }> {
  type Result = AnalysisResult & { from_cache?: boolean; cache_warning?: string };
  try {
    return await v1Fetch<Result>(`/api/v1/compat/analyze/${encodeURIComponent(handle)}`);
  } catch (err) {
    if (err instanceof V1ApiError) throw err; // real backend answer — no fallback
    const res = await fetch(`/api/analyze?handle=${encodeURIComponent(handle)}`);
    const body = (await res.json()) as Result & { error?: string; error_code?: string };
    if (!res.ok || body.error) {
      throw new V1ApiError(res.status, body.error_code ?? `HTTP_${res.status}`, body.error ?? `HTTP ${res.status}`);
    }
    return body;
  }
}
