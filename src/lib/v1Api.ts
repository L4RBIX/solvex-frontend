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

// ─── Gamification (Phase G1 + G2) ────────────────────────────────────────────
//
// Lightweight retention layer (XP, levels, streak, daily goal, badges, quests,
// activity timeline) derived server-side from real training actions only — no
// leaderboard, no duels, no social comparison, no payment/admin data ever
// appears here.

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

export type GamificationBadgeCategory = "onboarding" | "consistency" | "verification" | "premium";
export type GamificationBadgeRarity = "common" | "uncommon" | "rare";

export interface GamificationBadge {
  id: string;
  name: string;
  description: string;
  earned_at: string;
  category?: GamificationBadgeCategory;
  rarity?: GamificationBadgeRarity;
}

export interface GamificationXpEvent {
  event_type: string;
  label: string;
  xp_awarded: number;
  occurred_at: string;
  daily_cap_applied: boolean;
}

export interface GamificationDailyQuest {
  id: string;
  label: string;
  completed: boolean;
  completed_at: string | null;
}

export interface GamificationDailyQuests {
  date: string;
  completed_count: number;
  total_count: number;
  quests: GamificationDailyQuest[];
}

export interface GamificationWeeklyQuest {
  id: string;
  label: string;
  completed: boolean;
  progress: number;
  target: number;
}

export interface GamificationWeeklyQuests {
  week_start: string;
  completed_count: number;
  total_count: number;
  quests: GamificationWeeklyQuest[];
}

export interface GamificationMilestone {
  id: string;
  label: string;
  progress: number;
  target: number;
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
  // G2 fields — optional so an older backend response (G1-only) never crashes the widget.
  recent_xp_events?: GamificationXpEvent[];
  daily_quests?: GamificationDailyQuests;
  weekly_quests?: GamificationWeeklyQuests;
  milestones?: GamificationMilestone[];
}

export function getGamification(handle?: string): Promise<GamificationSnapshot> {
  const query = handle ? `?handle=${encodeURIComponent(handle)}` : "";
  return v1Fetch<GamificationSnapshot>(`/api/v1/gamification/me${query}`);
}

// ─── Private leaderboards (Phase G3) ─────────────────────────────────────────
//
// Invite-only weekly groups — no global leaderboard, no public profiles.

export interface LeaderboardSummary {
  leaderboard_id: string;
  name: string;
  visibility: string;
  member_role?: string;
  joined_at?: string;
  created_at?: string;
}

export interface LeaderboardWeeklyEntry {
  rank: number;
  display_name: string;
  handle: string | null;
  weekly_xp: number;
  level: number;
  active_days: number;
  daily_goals_completed: number;
  feedback_count: number;
  badges_earned_this_week: number;
}

export interface LeaderboardWeeklyResponse {
  leaderboard_id: string;
  name: string;
  visibility: string;
  week_start: string;
  viewer_rank: number | null;
  entries: LeaderboardWeeklyEntry[];
}

export interface CreateLeaderboardResponse extends LeaderboardSummary {
  invite_code: string;
  invite_expires_at?: string;
}

export function listLeaderboards(handle?: string): Promise<{ leaderboards: LeaderboardSummary[] }> {
  const query = handle ? `?handle=${encodeURIComponent(handle)}` : "";
  return v1Fetch(`/api/v1/leaderboards${query}`);
}

export function createLeaderboard(
  name: string,
  displayName: string,
  handle?: string
): Promise<CreateLeaderboardResponse> {
  const query = handle ? `?handle=${encodeURIComponent(handle)}` : "";
  return v1Fetch(`/api/v1/leaderboards${query}`, {
    method: "POST",
    body: JSON.stringify({ name, display_name: displayName }),
  });
}

export function joinLeaderboard(
  inviteCode: string,
  displayName: string,
  handle?: string
): Promise<{ leaderboard_id: string; name: string; member_role: string; already_member: boolean }> {
  return v1Fetch("/api/v1/leaderboards/join", {
    method: "POST",
    body: JSON.stringify({
      invite_code: inviteCode.trim(),
      display_name: displayName,
      handle: handle ?? undefined,
    }),
  });
}

export function getLeaderboardWeekly(
  leaderboardId: string,
  handle?: string
): Promise<LeaderboardWeeklyResponse> {
  const query = handle ? `?handle=${encodeURIComponent(handle)}` : "";
  return v1Fetch(`/api/v1/leaderboards/${encodeURIComponent(leaderboardId)}/weekly${query}`);
}

// ─── Friend duels (Phase G4) ─────────────────────────────────────────────────
//
// Invite-only 1v1 — no matchmaking, no Elo, no tournaments.

export type DuelMode = "rapid_10" | "classic_30";
export type DuelStatus = "waiting" | "active" | "completed" | "expired" | "cancelled";

export interface DuelProblem {
  problem_id: string;
  name: string;
  rating: number | null;
  tags: string[];
  contest_id?: number | null;
  index?: string | null;
  url?: string | null;
}

// Honest per-submission/per-participant verdict — never implies official
// Codeforces correctness (the catalog stores no official tests). See backend
// contestiq_api/duels.py VERDICT_* constants.
export type DuelVerdict =
  | "no_tests"
  | "compile_error"
  | "runtime_error"
  | "custom_tests_passed"
  | "custom_tests_failed"
  | "official_accepted";

export type DuelJudgingMode = "authoritative" | "custom_tests";

export interface DuelParticipant {
  display_name: string;
  handle: string | null;
  role: string;
  final_status: string;
  verdict?: DuelVerdict;
  accepted_at: string | null;
  joined_at: string;
  submission_count: number;
  is_viewer: boolean;
  is_winner: boolean;
}

export interface DuelDetail {
  duel_id: string;
  mode: DuelMode;
  status: DuelStatus;
  problem: DuelProblem;
  skill_id?: string | null;
  starts_at: string | null;
  expires_at: string;
  created_at: string;
  completed_at: string | null;
  winner_subject: string | null;
  result_reason: string | null;
  judging_mode?: DuelJudgingMode;
  test_locked?: boolean;
  viewer_subject?: string | null;
  viewer_role?: string | null;
  participants: DuelParticipant[];
}

export interface CreateDuelResponse {
  duel_id: string;
  mode: DuelMode;
  status: DuelStatus;
  problem: DuelProblem;
  invite_code: string;
  expires_at: string;
  created_at: string;
}

export interface DuelInvitePreview {
  duel_id: string;
  mode: DuelMode;
  status: DuelStatus;
  creator_display_name: string;
  problem: DuelProblem;
  expires_at: string;
  participants_count: number;
}

export interface DuelSummary {
  duel_id: string;
  mode: DuelMode;
  status: DuelStatus;
  problem_id: string;
  problem_rating: number | null;
  role: string;
  created_at: string;
  expires_at: string;
  winner_subject: string | null;
  result_reason: string | null;
}

export function listDuels(handle?: string): Promise<{ duels: DuelSummary[] }> {
  const query = handle ? `?handle=${encodeURIComponent(handle)}` : "";
  return v1Fetch(`/api/v1/duels${query}`);
}

export function createDuel(
  mode: DuelMode,
  displayName: string,
  handle?: string
): Promise<CreateDuelResponse> {
  const query = handle ? `?handle=${encodeURIComponent(handle)}` : "";
  return v1Fetch(`/api/v1/duels${query}`, {
    method: "POST",
    body: JSON.stringify({ mode, display_name: displayName }),
  });
}

export function previewDuelInvite(inviteCode: string): Promise<DuelInvitePreview> {
  return v1Fetch(`/api/v1/duels/invite/${encodeURIComponent(inviteCode)}`);
}

export function joinDuel(
  inviteCode: string,
  displayName: string,
  handle?: string
): Promise<{ duel_id: string; status: string; already_member: boolean; role: string }> {
  return v1Fetch("/api/v1/duels/join", {
    method: "POST",
    body: JSON.stringify({
      invite_code: inviteCode.trim(),
      display_name: displayName,
      handle: handle ?? undefined,
    }),
  });
}

export function getDuel(duelId: string, handle?: string): Promise<DuelDetail> {
  const query = handle ? `?handle=${encodeURIComponent(handle)}` : "";
  return v1Fetch(`/api/v1/duels/${encodeURIComponent(duelId)}${query}`);
}

export function startDuel(
  duelId: string,
  handle?: string
): Promise<DuelDetail & { arena_path?: string }> {
  const query = handle ? `?handle=${encodeURIComponent(handle)}` : "";
  return v1Fetch(`/api/v1/duels/${encodeURIComponent(duelId)}/start${query}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

// ─── Live duel room (Phase G4.1) ─────────────────────────────────────────────
//
// Lightweight state polled every 1–2s by the waiting room and the duel Arena.
// Never contains source code, invite hashes, Judge0 config, or hidden tests.

export interface DuelParticipantState {
  display_name: string;
  handle: string | null;
  role: string;
  is_viewer: boolean;
  ready: boolean;
  ready_at: string | null;
  joined_at: string;
  arena_opened: boolean;
  submission_count: number;
  wrong_attempts: number;
  hint_count: number;
  judging: boolean;
  accepted: boolean;
  accepted_at: string | null;
  seconds_to_accept: number | null;
  final_status: string;
  verdict: DuelVerdict;
  is_winner: boolean;
}

export interface DuelSharedTest {
  input: string;
  expected_output: string;
}

export interface DuelResultState {
  status: DuelStatus;
  winner_display_name: string | null;
  result_reason: string | null;
  completed_at: string | null;
  viewer_won: boolean;
  is_draw: boolean;
  xp_awarded: number;
}

export interface DuelState {
  duel_id: string;
  mode: DuelMode;
  status: DuelStatus;
  server_time: string;
  countdown_seconds: number;
  countdown_started_at: string | null;
  starts_at: string | null;
  expires_at: string;
  arena_path: string;
  duration_minutes: number;
  hints_max: number;
  judging_mode: DuelJudgingMode;
  judging_note: string;
  test_locked: boolean;
  shared_test: DuelSharedTest | null;
  problem: DuelProblem;
  skill_id?: string | null;
  participants: DuelParticipantState[];
  result: DuelResultState | null;
}

export interface DuelHintResponse {
  duel_id: string;
  hint_number: number;
  hint_text: string;
  hints_used: number;
  hints_remaining: number;
  note?: string;
}

export function getDuelState(duelId: string, handle?: string): Promise<DuelState> {
  const query = handle ? `?handle=${encodeURIComponent(handle)}` : "";
  return v1Fetch(`/api/v1/duels/${encodeURIComponent(duelId)}/state${query}`);
}

export function readyDuel(duelId: string, handle?: string): Promise<DuelState> {
  const query = handle ? `?handle=${encodeURIComponent(handle)}` : "";
  return v1Fetch(`/api/v1/duels/${encodeURIComponent(duelId)}/ready${query}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function openDuelArena(
  duelId: string,
  handle?: string
): Promise<{ duel_id: string; arena_opened_at: string | null }> {
  const query = handle ? `?handle=${encodeURIComponent(handle)}` : "";
  return v1Fetch(`/api/v1/duels/${encodeURIComponent(duelId)}/open-arena${query}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function requestDuelHint(duelId: string, handle?: string): Promise<DuelHintResponse> {
  const query = handle ? `?handle=${encodeURIComponent(handle)}` : "";
  return v1Fetch(`/api/v1/duels/${encodeURIComponent(duelId)}/hint${query}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function submitDuel(
  duelId: string,
  payload: {
    language: "cpp17" | "python3";
    source_code: string;
    stdin?: string;
    expected_output?: string | null;
  },
  handle?: string
): Promise<{
  submission_id: string;
  judge_status: string;
  verdict?: DuelVerdict;
  judging_mode?: DuelJudgingMode;
  passed: boolean;
  runtime_ms: number | null;
  memory_kb: number | null;
  message: string;
  duel: DuelDetail;
}> {
  const query = handle ? `?handle=${encodeURIComponent(handle)}` : "";
  return v1Fetch(`/api/v1/duels/${encodeURIComponent(duelId)}/submit${query}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getDuelResult(
  duelId: string,
  handle?: string
): Promise<{
  duel_id: string;
  status: DuelStatus;
  winner_subject: string | null;
  result_reason: string | null;
  completed_at: string | null;
  participants: DuelParticipant[];
  problem: DuelProblem;
  viewer_won: boolean;
  is_draw: boolean;
}> {
  const query = handle ? `?handle=${encodeURIComponent(handle)}` : "";
  return v1Fetch(`/api/v1/duels/${encodeURIComponent(duelId)}/result${query}`);
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
