import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy · SolveX",
  description:
    "What SolveX collects, what it stores, and what it never touches. Public Codeforces data only — no Codeforces password, no private data.",
};

const CONTACT_EMAIL = "kydyrbekbekarys44@gmail.com";

const sections = [
  {
    title: "What SolveX reads",
    body: [
      "SolveX analyzes publicly available Codeforces data: your submissions, verdicts, problem tags, problem ratings, and contest history, fetched from the official Codeforces public API. Everything we analyze is visible to anyone on codeforces.com without logging in.",
      "You can run an analysis by entering any public handle. No Codeforces login, token, or password is involved — SolveX never asks for, receives, or stores your Codeforces password.",
    ],
  },
  {
    title: "Accounts",
    body: [
      "Creating a SolveX account is optional and uses Supabase Auth. When you sign up we store your email address and authentication data managed by Supabase. We do not store passwords ourselves and we never link your account to private Codeforces credentials.",
      "Private actions — saving training progress, joining leaderboards, starting duels — require an authenticated account. Anonymous analysis stays anonymous.",
    ],
  },
  {
    title: "What we store",
    body: [
      "For account holders, SolveX stores: your training progress and queue history, gamification data (XP, levels, streaks, quests, badges), private leaderboard memberships, Arena duel history and results, and any feedback you send us.",
      "Analysis results are derived from public Codeforces data and may be cached to keep the product fast.",
    ],
  },
  {
    title: "What we never do",
    body: [
      "We never ask for or store your Codeforces password. We never access private Codeforces data. We do not sell your data. We do not show ads.",
      "SolveX is an independent project and is not affiliated with, endorsed by, or connected to Codeforces.",
    ],
  },
  {
    title: "Deletion and export",
    body: [
      `You can request deletion or export of your account data at any time by emailing ${CONTACT_EMAIL}. We will confirm and complete the request as quickly as we can.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main style={{ background: "#020806", minHeight: "100vh" }}>
        <div
          className="tx-container"
          style={{ maxWidth: "760px", paddingTop: "160px", paddingBottom: "120px" }}
        >
          <h1 className="tx-h2" style={{ marginBottom: "12px" }}>Privacy</h1>
          <p style={{ fontSize: "14px", color: "#8A9A96", marginBottom: "56px" }}>
            Last updated July 2026 · Plain language, no legal maze.
          </p>

          {sections.map((section) => (
            <section key={section.title} style={{ marginBottom: "44px" }}>
              <h2
                style={{
                  fontSize: "19px",
                  fontWeight: 700,
                  color: "#F4F7F6",
                  letterSpacing: "-0.02em",
                  marginBottom: "14px",
                }}
              >
                {section.title}
              </h2>
              {section.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 40)}
                  style={{
                    fontSize: "15px",
                    lineHeight: "26px",
                    color: "#A7B5B1",
                    marginBottom: "12px",
                  }}
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          <div
            style={{
              marginTop: "56px",
              padding: "20px 24px",
              background: "rgba(0,245,160,0.03)",
              border: "1px solid rgba(0,245,160,0.1)",
              borderRadius: "12px",
              fontSize: "14px",
              lineHeight: "23px",
              color: "#8A9A96",
            }}
          >
            Questions about this policy?{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=SolveX%20privacy`}
              style={{ color: "#00F5A0", textDecoration: "none" }}
            >
              Email us
            </a>
            {" "}— we answer personally.
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
