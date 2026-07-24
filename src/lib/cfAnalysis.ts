/**
 * Legacy analysis response types.
 *
 * The analysis itself is computed by the SolveX Python backend
 * (backend/Trace_X_project/contestiq_api/legacy_compat.py) and served via
 * /api/v1/compat/analyze/{handle}. The old TypeScript analysis engine that
 * lived in this file was removed so the backend stays the single source of
 * truth — only the response types the UI renders remain.
 */

export interface FrictionArea {
  tag: string;
  solved: number;
  attempted: number;
  totalSubmissions: number;
  waCount: number;
  tleCount: number;
  reCount: number;
  avgAttemptsBeforeAC: number;
  solveRate: number;
  frictionScore: number;
  issue: string;
  action: string;
  confidence: "high" | "medium" | "low";
  color: string;
}

export interface StrongTopic {
  tag: string;
  solved: number;
  solveRate: number;
  avgAttempts: number;
}

export interface RecommendedProblem {
  name: string;
  rating: number;
  tags: string[];
  reason: string;
  contestId?: number;
  index?: string;
}

export interface QueueDay {
  day: number;
  focus: string;
  problemName?: string;
  contestId?: number;
  index?: string;
  rating: number;
  reason: string;
  tagColor: string;
}

export interface AnalysisResult {
  handle: string;
  profile: {
    handle: string;
    rating: number;
    maxRating: number;
    rank: string;
    maxRank: string;
    country: string;
    organization: string;
  };
  summary: {
    totalSubmissions: number;
    uniqueSolved: number;
    mainLanguage: string;
    avgSolvedRating: number;
  };
  diagnosis: string;
  frictionAreas: FrictionArea[];
  strongTopics: StrongTopic[];
  errorBreakdown: {
    wrongAnswer: number;
    timeLimitExceeded: number;
    runtimeError: number;
    compileError: number;
    memoryLimitExceeded: number;
    other: number;
  };
  ratingComfortZone: {
    min: number;
    max: number;
    sweet: number;
  };
  recommendedProblems: RecommendedProblem[];
  sevenDayQueue: QueueDay[];
}
