import { CheckIcon } from "@/components/icons";
import { RevealOnScroll } from "@/components/animations/motion";

const plans = [
  {
    name: "Free Beta",
    price: "$0",
    period: "forever during beta",
    description: "Full analysis, no restrictions. Everything while we validate the product.",
    cta: "Analyze now",
    ctaHref: "#hero-input",
    highlight: true,
    features: [
      "Full submission analysis",
      "Friction area detection",
      "Error pattern breakdown",
      "7-day training queue",
      "No login required",
      "No credit card required",
    ],
  },
  {
    name: "Club Pilot",
    price: "$0",
    period: "for founding users",
    description: "For competitive programming clubs running group training.",
    cta: "Contact us",
    ctaHref: "mailto:kydyrbekbekarys44@gmail.com?subject=SolveX%20Club%20Pilot",
    highlight: false,
    features: [
      "Everything in Free Beta",
      "Bulk handle analysis",
      "Coach dashboard (early access)",
      "CSV export",
      "Priority support",
    ],
  },
  {
    name: "Pro",
    price: "TBD",
    period: "coming after beta",
    description: "Advanced reports, team support, and SkillTrace verification.",
    cta: "Coming soon",
    ctaHref: "#",
    highlight: false,
    comingSoon: true,
    features: [
      "Everything in Club Pilot",
      "SkillTrace verification",
      "Multi-handle comparison",
      "Historical progress tracking",
      "API access",
    ],
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="tx-section">
      <div className="tx-container">
        <div className="tx-section-header">
          <div className="section-badge" style={{ marginBottom: "20px" }}>Pricing</div>
          <h2 className="tx-h2" style={{ marginBottom: "16px" }}>
            Free during beta.{" "}
            <span style={{ color: "#00F5A0" }}>No catch.</span>
          </h2>
          <p className="tx-subtitle">
            SolveX is free while we validate the product. No trials, no paywalls.
          </p>
        </div>

        <div
          className="pricing-grid-3col"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", alignItems: "start" }}
        >
          {plans.map((plan, i) => (
            <RevealOnScroll key={plan.name} delay={i + 1}>
            <div
              className="tx-card"
              style={{
                padding: "32px",
                opacity: plan.comingSoon ? 0.62 : 1,
                position: "relative",
                borderColor: plan.highlight ? "rgba(0,245,160,0.4)" : "rgba(0,245,160,0.14)",
                background: plan.highlight ? "rgba(0,245,160,0.04)" : "#07110E",
              }}
            >
              {plan.highlight && (
                <div
                  style={{
                    position: "absolute",
                    top: "-1px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#00F5A0",
                    color: "#020806",
                    fontSize: "10.5px",
                    fontWeight: 800,
                    padding: "3px 16px",
                    borderRadius: "0 0 8px 8px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  Current plan
                </div>
              )}

              <div style={{ marginBottom: "28px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#8A9A96", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "10px" }}>
                  {plan.name}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "8px" }}>
                  <span
                    style={{
                      fontSize: "40px",
                      fontWeight: 800,
                      color: plan.highlight ? "#00F5A0" : "#F4F7F6",
                      fontFamily: "var(--font-rebond, system-ui)",
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                    }}
                  >
                    {plan.price}
                  </span>
                  <span style={{ fontSize: "12px", color: "#8A9A96", lineHeight: "18px", maxWidth: "80px" }}>
                    {plan.period}
                  </span>
                </div>
                <p style={{ fontSize: "13.5px", lineHeight: "21px", color: "#8A9A96" }}>
                  {plan.description}
                </p>
              </div>

              {plan.comingSoon ? (
                <span
                  aria-disabled="true"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "11px 20px",
                    borderRadius: "9999px",
                    fontSize: "14px",
                    fontWeight: 700,
                    marginBottom: "28px",
                    letterSpacing: "-0.01em",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.3)",
                    cursor: "default",
                  }}
                >
                  {plan.cta}
                </span>
              ) : (
                <a
                  href={plan.ctaHref}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "11px 20px",
                    borderRadius: "9999px",
                    fontSize: "14px",
                    fontWeight: 700,
                    textDecoration: "none",
                    marginBottom: "28px",
                    transition: "background 0.2s, border-color 0.2s",
                    letterSpacing: "-0.01em",
                    ...(plan.highlight
                      ? { background: "#00F5A0", color: "#020806" }
                      : {
                          background: "transparent",
                          border: "1px solid rgba(0,245,160,0.28)",
                          color: "#00F5A0",
                        }),
                  }}
                >
                  {plan.cta}
                </a>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span style={{ color: "#00F5A0", marginTop: "2px", flexShrink: 0 }}>
                      <CheckIcon />
                    </span>
                    <span style={{ fontSize: "13.5px", color: "#c8d4d0", lineHeight: "21px" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
