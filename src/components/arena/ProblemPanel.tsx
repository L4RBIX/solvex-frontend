"use client";

import { Clock, ExternalLink, HardDrive, Tag } from "lucide-react";

import { codeforcesProblemHref } from "@/lib/problemRoutes";
import type { ArenaProblem } from "@/types/arena";

interface ProblemPanelProps {
  problem: ArenaProblem;
}

function ratingColor(rating: number | null): string {
  if (rating === null) return "#8A9A96";
  if (rating >= 2400) return "#FF3333";
  if (rating >= 2100) return "#FF6600";
  if (rating >= 1600) return "#AA00AA";
  if (rating >= 1400) return "#5577FF";
  if (rating >= 1200) return "#00A050";
  return "#8A9A96";
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3
        style={{
          fontSize: "10px",
          fontFamily: "ui-monospace, monospace",
          fontWeight: 700,
          color: "#4A6A5A",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "6px",
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function ProblemPanel({ problem }: ProblemPanelProps) {
  const officialUrl =
    problem.official_url ??
    codeforcesProblemHref(problem.key) ??
    "https://codeforces.com/problemset";
  const ratingTone = ratingColor(problem.rating);
  const limits = [
    problem.time_limit
      ? { icon: <Clock size={10} />, text: problem.time_limit }
      : null,
    problem.memory_limit
      ? { icon: <HardDrive size={10} />, text: problem.memory_limit }
      : null,
  ].filter((item) => item !== null);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid rgba(0,245,160,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: "10px",
            fontFamily: "ui-monospace, monospace",
            fontWeight: 700,
            color: "#4A6A5A",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Problem
        </span>
        <a
          href={officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            color: "#00D9F5",
            fontSize: "10px",
            fontFamily: "ui-monospace, monospace",
            fontWeight: 700,
            textDecoration: "none",
            textAlign: "right",
          }}
        >
          Open official statement
          <ExternalLink size={10} />
        </a>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "10px",
              marginBottom: "8px",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  color: "#4A6A5A",
                  fontFamily: "ui-monospace, monospace",
                  fontSize: "10px",
                  marginBottom: "4px",
                }}
              >
                {problem.key}
              </div>
              <h1
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#F4F7F6",
                  lineHeight: 1.35,
                  margin: 0,
                  overflowWrap: "anywhere",
                }}
              >
                {problem.name}
              </h1>
            </div>
            <span
              style={{
                flexShrink: 0,
                fontSize: "11px",
                fontFamily: "ui-monospace, monospace",
                fontWeight: 700,
                color: ratingTone,
                background: `${ratingTone}18`,
                border: `1px solid ${ratingTone}35`,
                borderRadius: "6px",
                padding: "2px 7px",
              }}
            >
              {problem.rating ?? "Unrated"}
            </span>
          </div>

          {problem.is_sample && (
            <span
              style={{
                display: "inline-block",
                fontSize: "10px",
                fontFamily: "ui-monospace, monospace",
                color: "#4A6A5A",
                border: "1px solid rgba(0,245,160,0.12)",
                borderRadius: "4px",
                padding: "2px 8px",
                marginBottom: "8px",
              }}
            >
              Sample training problem
            </span>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "5px",
              marginBottom: limits.length ? "10px" : 0,
            }}
          >
            {problem.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  maxWidth: "100%",
                  fontSize: "10px",
                  fontFamily: "ui-monospace, monospace",
                  color: "#6A8A7A",
                  background: "rgba(0,245,160,0.04)",
                  border: "1px solid rgba(0,245,160,0.1)",
                  borderRadius: "4px",
                  padding: "2px 7px",
                  overflowWrap: "anywhere",
                }}
              >
                <Tag size={8} style={{ flexShrink: 0 }} />
                {tag}
              </span>
            ))}
          </div>

          {limits.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
              {limits.map((item) => (
                <span
                  key={item.text}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                    fontFamily: "ui-monospace, monospace",
                    color: "#4A6A5A",
                  }}
                >
                  {item.icon}
                  {item.text}
                </span>
              ))}
            </div>
          )}
        </div>

        {problem.content_available === false ? (
          <div
            style={{
              border: "1px solid rgba(0,217,245,0.2)",
              background: "rgba(0,217,245,0.05)",
              borderRadius: "8px",
              padding: "14px",
            }}
          >
            <p
              style={{
                color: "#B8C9C4",
                fontSize: "13px",
                lineHeight: "20px",
                margin: 0,
              }}
            >
              SolveX has catalog metadata for this problem but does not
              currently store a SolveX-authored practice summary or the
              official Codeforces statement.
            </p>
          </div>
        ) : (
          <>
            <Section
              title={
                problem.is_sample
                  ? "Practice problem"
                  : "SolveX-authored practice summary"
              }
            >
              <p
                style={{
                  fontSize: "13px",
                  color: "#C8D4D0",
                  lineHeight: "21px",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                }}
              >
                {problem.statement}
              </p>
              {!problem.is_sample && (
                <p
                  style={{
                    color: "#6A8A7A",
                    fontSize: "11px",
                    lineHeight: "17px",
                    margin: "8px 0 0",
                  }}
                >
                  SolveX-authored practice summary. Use the official
                  Codeforces page for the original statement.
                </p>
              )}
            </Section>

            {problem.input_format && (
              <Section title="Input">
                <p
                  style={{
                    fontSize: "13px",
                    color: "#B0C0BC",
                    lineHeight: "21px",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {problem.input_format}
                </p>
              </Section>
            )}

            {problem.output_format && (
              <Section title="Output">
                <p
                  style={{
                    fontSize: "13px",
                    color: "#B0C0BC",
                    lineHeight: "21px",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {problem.output_format}
                </p>
              </Section>
            )}

            {problem.constraints && (
              <Section title="Constraints">
                <p
                  style={{
                    fontSize: "13px",
                    color: "#9EB5AF",
                    lineHeight: "20px",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {problem.constraints}
                </p>
              </Section>
            )}

            {problem.sample_tests.length > 0 && (
              <Section title="Public practice samples">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {problem.sample_tests.map((test, index) => (
                    <div
                      key={`${test.input}-${index}`}
                      style={{
                        borderRadius: "8px",
                        border: "1px solid rgba(0,245,160,0.1)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                        }}
                      >
                        {[
                          ["Input", test.input],
                          ["Output", test.output],
                        ].map(([label, value], cellIndex) => (
                          <div
                            key={label}
                            style={{
                              padding: "10px 12px",
                              borderRight:
                                cellIndex === 0
                                  ? "1px solid rgba(0,245,160,0.1)"
                                  : undefined,
                              minWidth: 0,
                            }}
                          >
                            <p
                              style={{
                                fontSize: "9px",
                                fontFamily: "ui-monospace, monospace",
                                color: "#3A5A4A",
                                margin: "0 0 6px",
                                textTransform: "uppercase",
                              }}
                            >
                              {label}
                            </p>
                            <pre
                              style={{
                                fontSize: "12px",
                                fontFamily: "ui-monospace, monospace",
                                color: "#9EB5AF",
                                whiteSpace: "pre-wrap",
                                overflowWrap: "anywhere",
                                lineHeight: "18px",
                                margin: 0,
                              }}
                            >
                              {value}
                            </pre>
                          </div>
                        ))}
                      </div>
                      {test.note && (
                        <p
                          style={{
                            borderTop: "1px solid rgba(0,245,160,0.08)",
                            padding: "8px 12px",
                            fontSize: "11px",
                            color: "#6A8A7A",
                            lineHeight: "16px",
                            margin: 0,
                          }}
                        >
                          {test.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </>
        )}

        {problem.notes && (
          <Section title="Notes">
            <p
              style={{
                fontSize: "13px",
                color: "#9EB5AF",
                lineHeight: "20px",
                margin: 0,
                whiteSpace: "pre-wrap",
              }}
            >
              {problem.notes}
            </p>
          </Section>
        )}
      </div>
    </div>
  );
}
