import { API_BASE } from "@/lib/apiBase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CoachProfile {
  id?: string;
  preferred_language?: string;
  preferred_help_style?: string;
  common_error_patterns?: Array<{ type: string; count: number }>;
  common_wa_patterns?: string[];
  weak_tags?: string[];
  strong_tags?: string[];
  repeated_mistakes?: string[];
  coaching_notes?: string[];
  summary?: string;
  confidence_score?: number;
  last_updated_at?: string;
}

// ─── Anonymous user key ───────────────────────────────────────────────────────

const ANON_KEY_STORAGE = "solvex_anon_user_key";

export function getOrCreateAnonKey(): string {
  try {
    let key = localStorage.getItem(ANON_KEY_STORAGE);
    if (!key) {
      key =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(ANON_KEY_STORAGE, key);
    }
    return key;
  } catch {
    return `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function getCoachProfile(anonKey: string): Promise<CoachProfile | null> {
  try {
    const url = `${API_BASE}/api/copilot/profile?anonymous_user_key=${encodeURIComponent(anonKey)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const body = (await res.json()) as { status: string; profile: CoachProfile | null };
    return body.profile ?? null;
  } catch {
    return null;
  }
}

export async function updateCoachProfile(anonKey: string): Promise<CoachProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/api/copilot/profile/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonymous_user_key: anonKey }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { status: string; profile: CoachProfile | null };
    return body.profile ?? null;
  } catch {
    return null;
  }
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export const STYLE_LABELS: Record<string, string> = {
  tiny_hints:     "Tiny hints first",
  conceptual:     "Conceptual guidance",
  debug_guidance: "Step-by-step debug",
  detailed:       "Detailed explanations",
  solution_heavy: "Full solutions",
};

export const ERROR_LABELS: Record<string, string> = {
  undeclared_variable: "undeclared variables",
  syntax:              "syntax errors",
  overflow:            "integer overflow",
  type_error:          "type conversion",
  index_error:         "array bounds / null ptr",
  edge_case:           "missing edge cases",
  complexity:          "TLE / complexity",
  wrong_formula:       "wrong formula",
  unknown:             "various errors",
};
