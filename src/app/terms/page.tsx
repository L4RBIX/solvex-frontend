import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms · SolveX",
  description: "Terms of use for SolveX, an independent training tool built on public Codeforces data.",
};

const CONTACT_EMAIL = "kydyrbekbekarys44@gmail.com";

const sections = [
  {
    title: "The service",
    body: "SolveX analyzes public Codeforces data to generate training diagnostics, plans, gamification, leaderboards, and duels. The service is provided free of charge during beta and may change as the product evolves. We will be transparent before anything about pricing changes.",
  },
  {
    title: "Not affiliated with Codeforces",
    body: "SolveX is an independent project. It is not affiliated with, endorsed by, or connected to Codeforces. Codeforces data is used under its publicly accessible API.",
  },
  {
    title: "Your account",
    body: "Accounts use Supabase Auth. You are responsible for activity under your account. Don't abuse the service: no scraping at disruptive rates, no attempts to access other users' private data, no cheating in duels or leaderboards.",
  },
  {
    title: "No guarantees",
    body: "Diagnostics are heuristics over noisy public data — treat them as hypotheses to test, not ground truth. The service is provided as-is during beta, without warranties of availability or fitness for a particular purpose.",
  },
  {
    title: "Termination",
    body: "You can stop using SolveX at any time and request deletion of your data. We may suspend accounts that abuse the service or other users.",
  },
  {
    title: "Contact",
    body: `Questions about these terms: ${CONTACT_EMAIL}.`,
  },
];

export default function TermsPage() {
  return (
    <>
      <Header />
      <main style={{ background: "#020806", minHeight: "100vh" }}>
        <div
          className="tx-container"
          style={{ maxWidth: "760px", paddingTop: "160px", paddingBottom: "120px" }}
        >
          <h1 className="tx-h2" style={{ marginBottom: "12px" }}>Terms</h1>
          <p style={{ fontSize: "14px", color: "#8A9A96", marginBottom: "56px" }}>
            Last updated July 2026 · Short, honest, readable.
          </p>

          {sections.map((section) => (
            <section key={section.title} style={{ marginBottom: "40px" }}>
              <h2
                style={{
                  fontSize: "19px",
                  fontWeight: 700,
                  color: "#F4F7F6",
                  letterSpacing: "-0.02em",
                  marginBottom: "12px",
                }}
              >
                {section.title}
              </h2>
              <p style={{ fontSize: "15px", lineHeight: "26px", color: "#A7B5B1", margin: 0 }}>
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
