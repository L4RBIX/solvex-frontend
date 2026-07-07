import { CheckIcon } from "@/components/icons";
import { RevealOnScroll } from "@/components/animations/motion";

const bullets = [
  "Public Codeforces data only",
  "No login required",
  "Heuristic analysis, not ML",
  "Human-readable explanations",
  "More reliable with more submissions",
];

const analyzed = [
  "Submissions", "Verdicts", "Tags", "Problem ratings",
  "Attempts before AC", "WA/TLE patterns", "Avoided topics", "Rating buckets",
];

export function MethodologySection() {
  return (
    <section id="methodology" className="tx-section">
      <div className="tx-container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "56px", alignItems: "start" }}>
          {/* Left: heading + bullets */}
          <RevealOnScroll delay={1}>
          <div>
            <div className="section-badge" style={{ marginBottom: "24px" }}>Transparency</div>
            <h2 className="tx-h2" style={{ marginBottom: "16px" }}>
              Transparent methodology.<br />
              <span style={{ color: "#00F5A0" }}>Not magic.</span>
            </h2>
            <p style={{ fontSize: "17px", lineHeight: "28px", color: "#8A9A96", marginBottom: "36px" }}>
              SolveX uses explainable rule-based analytics based on public Codeforces data. No hidden AI. No black box.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {bullets.map((b) => (
                <div key={b} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ color: "#00F5A0", marginTop: "2px", flexShrink: 0 }}>
                    <CheckIcon />
                  </span>
                  <span style={{ fontSize: "15px", color: "#c8d4d0", lineHeight: "22px" }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
          </RevealOnScroll>

          {/* Right: what we analyze + caveat */}
          <RevealOnScroll delay={2}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="tx-card" style={{ padding: "28px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#00F5A0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "18px" }}>
                What we analyze
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {analyzed.map((item) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "13.5px",
                      color: "#c8d4d0",
                      lineHeight: "20px",
                    }}
                  >
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#00F5A0", flexShrink: 0, display: "inline-block" }} />
                    {item}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: "13px", lineHeight: "21px", color: "#8A9A96", marginTop: "18px", borderTop: "1px solid rgba(0,245,160,0.08)", paddingTop: "16px" }}>
                Every insight has a plain-language reason attached to it.
              </p>
            </div>

            {/* Caveat warning */}
            <div
              style={{
                background: "rgba(250,204,21,0.04)",
                border: "1px solid rgba(250,204,21,0.18)",
                borderRadius: "12px",
                padding: "18px 20px",
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: "16px", flexShrink: 0, lineHeight: 1.3 }}>⚠</span>
              <p style={{ fontSize: "13px", lineHeight: "21px", color: "#c8d4d0", margin: 0 }}>
                <strong style={{ color: "#FACC15" }}>Caveat: </strong>
                Codeforces tags are noisy. SolveX does not claim perfect diagnosis. It highlights patterns worth testing in your training — not guaranteed ground truth. Always pair analysis with your own judgment.
              </p>
            </div>
          </div>
          </RevealOnScroll>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #methodology .tx-container > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
