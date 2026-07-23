"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import {
  arenaProblemHref,
  codeforcesProblemHref,
} from "@/lib/problemRoutes";

interface ProblemActionsProps {
  problemId: string;
  handle?: string;
  compact?: boolean;
}

export function ProblemActions({
  problemId,
  handle,
  compact = false,
}: ProblemActionsProps) {
  const arenaHref = arenaProblemHref(problemId, handle);
  const codeforcesHref = codeforcesProblemHref(problemId);
  if (!arenaHref || !codeforcesHref) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: compact ? "8px" : "10px",
        marginTop: compact ? "6px" : "10px",
      }}
    >
      <Link
        href={arenaHref}
        className="tx-press"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: compact ? "28px" : "32px",
          padding: compact ? "5px 10px" : "6px 14px",
          borderRadius: "7px",
          background: "#00F5A0",
          color: "#020806",
          fontSize: compact ? "11px" : "12px",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Solve in Arena
      </Link>
      <a
        href={codeforcesHref}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          minHeight: compact ? "28px" : "32px",
          color: "#8A9A96",
          fontSize: compact ? "10px" : "11px",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Codeforces
        <ExternalLink size={compact ? 10 : 11} aria-hidden />
      </a>
    </div>
  );
}
