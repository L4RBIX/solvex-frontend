import { NextRequest, NextResponse } from "next/server";
import type { AnalysisResult } from "@/lib/cfAnalysis";

export const runtime = "nodejs";

// Thin proxy to the SolveX Python backend — the single source of truth for
// analysis. The legacy TypeScript analysis engine was removed; the backend
// serves the same AnalysisResult shape from /api/v1/compat/analyze/{handle}.
const BACKEND_BASE = (
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000"
)
  .trim()
  .replace(/\/$/, "");

// Last-good cache per handle, used only when the backend reports Codeforces
// rate limiting / unavailability. Cleared on server restart.
const ANALYSIS_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface AnalysisCacheEntry {
  result: AnalysisResult;
  cachedAt: number;
}
const analysisCache = new Map<string, AnalysisCacheEntry>();

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle")?.trim();

  if (!handle) {
    return NextResponse.json(
      { error: "handle parameter is required" },
      { status: 400 }
    );
  }

  const cacheKey = handle.toLowerCase();

  try {
    const res = await fetch(
      `${BACKEND_BASE}/api/v1/compat/analyze/${encodeURIComponent(handle)}`,
      { cache: "no-store" }
    );

    const body = await res.json();

    if (res.ok) {
      const result = body as AnalysisResult;
      analysisCache.set(cacheKey, { result, cachedAt: Date.now() });
      return NextResponse.json(result, {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=60",
        },
      });
    }

    const errorCode: string = body?.error_code ?? "";
    const message: string = body?.message ?? "Unexpected error during analysis";

    if (
      errorCode === "CODEFORCES_RATE_LIMITED" ||
      errorCode === "CODEFORCES_UNAVAILABLE"
    ) {
      const cached = analysisCache.get(cacheKey);
      if (cached && Date.now() - cached.cachedAt < ANALYSIS_CACHE_TTL_MS) {
        return NextResponse.json({
          ...cached.result,
          from_cache: true,
          cache_warning:
            errorCode === "CODEFORCES_RATE_LIMITED"
              ? "Codeforces is rate-limiting requests. Showing the latest cached analysis instead."
              : "Codeforces API is temporarily unavailable. Showing the latest cached analysis instead.",
        });
      }
    }

    return NextResponse.json(
      { error: message, error_code: errorCode || undefined },
      { status: res.status }
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Analysis backend is unreachable. Check that the SolveX API is running and NEXT_PUBLIC_API_URL is configured.",
        error_code: "BACKEND_UNREACHABLE",
      },
      { status: 502 }
    );
  }
}
