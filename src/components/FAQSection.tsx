"use client";

import { useState } from "react";
import { RevealOnScroll } from "@/components/animations/motion";

const FAQ_ITEMS = [
  {
    question: "Do I need to log in?",
    answer: "No. SolveX uses only public data from the Codeforces API. You enter your handle and we fetch your public submissions, verdicts, and problem tags. No OAuth, no token, no account required.",
  },
  {
    question: "Does SolveX use private Codeforces data?",
    answer: "No. We only use publicly available data — your submissions, verdicts, problem metadata, and tags. Everything we analyze is accessible to anyone on the Codeforces website without logging in.",
  },
  {
    question: "Is this machine learning?",
    answer: "No. SolveX uses rule-based heuristic analysis — specific formulas and thresholds to identify patterns. There is no neural network, no LLM, no training data. Every output is explainable.",
  },
  {
    question: "How accurate is the diagnosis?",
    answer: "It depends on your submission history. More problems, more reliable patterns. Codeforces tags are also noisy — a problem tagged 'constructive' may be more about math or greedy. We show confidence levels and always recommend treating results as hypotheses to test, not ground truth.",
  },
  {
    question: "Why can solved topics still appear as friction areas?",
    answer: "Solved rate alone does not indicate friction. A topic where you solved 100/100 problems but needed 5 attempts on average, or accumulated heavy WA counts, still represents a training gap. SolveX weights retry cost, WA density, and TLE frequency — not just AC rate.",
  },
  {
    question: "What is SkillTrace?",
    answer: "SkillTrace is a coming feature that will verify improvement by recording the process of solving — not just whether you got AC, but how many attempts it took, what errors appeared, and how your code evolved. It is not live yet.",
  },
  {
    question: "Is SolveX free?",
    answer: "Yes. SolveX is fully free during the beta period. No credit card, no trial timer, no hidden limits. We will be transparent before anything changes.",
  },
  {
    question: "Who built SolveX?",
    answer: "SolveX is built by two young founders from Kazakhstan — Kydyrbek Bekarys and Shaimardan Yerbossyn — working on competitive programming, AI, and product building. It started as a personal tool to diagnose why rating gains stalled, and grew from there.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="tx-section">
      <div className="tx-container">
        <RevealOnScroll>
          <div className="tx-section-header">
            <div className="section-badge" style={{ marginBottom: "20px" }}>FAQ</div>
            <h2 className="tx-h2" style={{ marginBottom: "16px" }}>Questions</h2>
            <p className="tx-subtitle">
              Still have a question?{" "}
              <a href="mailto:kydyrbekbekarys44@gmail.com?subject=SolveX%20question" style={{ color: "#00F5A0", textDecoration: "none" }}>
                Email us.
              </a>
            </p>
          </div>
        </RevealOnScroll>

        {/* Accordion */}
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            const isLast = index === FAQ_ITEMS.length - 1;

            return (
              <div
                key={index}
                style={{
                  borderTop: "1px solid rgba(0,245,160,0.08)",
                  borderBottom: isLast ? "1px solid rgba(0,245,160,0.08)" : "none",
                  padding: "22px 0",
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#F4F7F6",
                    gap: "16px",
                    width: "100%",
                    background: "none",
                    border: "none",
                    padding: 0,
                    textAlign: "left",
                    letterSpacing: "-0.01em",
                  }}
                  aria-expanded={isOpen}
                >
                  <span>{item.question}</span>
                  <span
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      border: isOpen ? "1px solid rgba(0,245,160,0.5)" : "1px solid rgba(255,255,255,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: isOpen ? "#00F5A0" : "rgba(255,255,255,0.4)",
                      background: isOpen ? "rgba(0,245,160,0.08)" : "transparent",
                      transition: "background 0.2s, border-color 0.2s, color 0.2s, transform 0.2s",
                      transform: isOpen ? "rotate(45deg)" : "none",
                      fontSize: "18px",
                      lineHeight: 1,
                    }}
                  >
                    +
                  </span>
                </button>

                <div
                  style={{
                    overflow: "hidden",
                    maxHeight: isOpen ? "500px" : "0px",
                    transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "15px",
                      lineHeight: "26px",
                      color: "#8A9A96",
                      paddingTop: "12px",
                      margin: 0,
                    }}
                  >
                    {item.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
