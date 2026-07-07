import Image from "next/image";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TableRow {
  keyword: string;
  volume: string;
  intent: "Navigational" | "Informational";
  kd: number;
  position: number;
  visualRank: number;
  change: string;
  url: string;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const TABLE_ROWS: TableRow[] = [
  { keyword: "wope",        volume: "132.8K", intent: "Navigational",  kd: 50,  position: 1,  visualRank: 1,  change: "+2",  url: "wope.com/" },
  { keyword: "seo do",      volume: "29.4K",  intent: "Informational", kd: 17,  position: 4,  visualRank: 5,  change: "0",   url: "wope.com/" },
  { keyword: "do seo",      volume: "26.7K",  intent: "Navigational",  kd: 100, position: 7,  visualRank: 9,  change: "+4",  url: "wope.com/" },
  { keyword: "free content",volume: "21.3K",  intent: "Informational", kd: 69,  position: 12, visualRank: 13, change: "+in", url: "wope.com/free-tools/" },
  { keyword: "daily rank",  volume: "17.5K",  intent: "Informational", kd: 31,  position: 14, visualRank: 16, change: "-12", url: "wiki.wope.com/" },
  { keyword: "localized kw",volume: "13.9K",  intent: "Navigational",  kd: 57,  position: 17, visualRank: 17, change: "+in", url: "wiki.wope.com/" },
  { keyword: "amazon rank", volume: "11.1K",  intent: "Informational", kd: 44,  position: 26, visualRank: 29, change: "+8",  url: "wope.com/" },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KdBadge({ value }: { value: number }) {
  const color =
    value > 66
      ? { bg: "rgba(239,68,68,0.15)", text: "rgb(239,100,100)" }
      : value >= 34
      ? { bg: "rgba(251,146,60,0.15)", text: "rgb(251,146,60)" }
      : { bg: "rgba(34,197,94,0.15)", text: "rgb(74,222,128)" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 32,
        padding: "2px 6px",
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        background: color.bg,
        color: color.text,
      }}
    >
      {value}
    </span>
  );
}

function ChangeCell({ value }: { value: string }) {
  let color = "rgba(255,255,255,0.4)";
  if (value.startsWith("+in")) color = "rgb(167,139,250)";
  else if (value.startsWith("+")) color = "rgb(74,222,128)";
  else if (value.startsWith("-")) color = "rgb(239,100,100)";

  return (
    <span style={{ fontSize: 13, fontWeight: 600, color }}>
      {value}
    </span>
  );
}

function TrendBar() {
  // Simple mini bar-chart representation
  const heights = [3, 5, 4, 7, 6, 8, 5, 9, 7, 6];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 20 }}>
      {heights.map((h, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: h * 2,
            borderRadius: 1,
            background: `rgba(139,92,246,${0.4 + (h / 10) * 0.6})`,
          }}
        />
      ))}
    </div>
  );
}

function IntentBadge({ intent }: { intent: string }) {
  const isNav = intent === "Navigational";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 500,
        background: isNav ? "rgba(99,102,241,0.15)" : "rgba(20,184,166,0.12)",
        color: isNav ? "rgb(165,180,252)" : "rgb(94,234,212)",
        whiteSpace: "nowrap",
      }}
    >
      {intent}
    </span>
  );
}

function PillButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.04)",
        color: "rgba(255,255,255,0.6)",
        fontSize: 12,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Cards container — static border with subtle corner glows (wope.com style)
// ---------------------------------------------------------------------------

function CardsContainer({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        .cards-container {
          position: relative;
          border-radius: 24px;
          background: rgb(10, 1, 24);
          border: 1px solid rgba(139, 92, 246, 0.25);
          box-shadow:
            0 0 0 1px rgba(139, 92, 246, 0.08),
            0 0 60px rgba(139, 92, 246, 0.08),
            inset 0 0 60px rgba(139, 92, 246, 0.03);
          overflow: hidden;
        }
        /* Subtle corner glow top-left */
        .cards-container::before {
          content: '';
          position: absolute;
          top: -1px;
          left: -1px;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle at top left, rgba(139,92,246,0.35) 0%, transparent 70%);
          border-radius: 24px 0 0 0;
          pointer-events: none;
          z-index: 0;
        }
        /* Subtle corner glow bottom-right */
        .cards-container::after {
          content: '';
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle at bottom right, rgba(99,51,220,0.25) 0%, transparent 70%);
          border-radius: 0 0 24px 0;
          pointer-events: none;
          z-index: 0;
        }
        .cards-container > * { position: relative; z-index: 1; }
      `}</style>
      <div className="cards-container">{children}</div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Card: Detailed Backlink Profile Analysis
// ---------------------------------------------------------------------------

function CardDetailedBacklink() {
  return (
    <div
      style={{
        padding: 40,
        borderRight: "1px solid rgba(255,255,255,0.08)",
        height: 544,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h3
        style={{
          fontFamily: "var(--font-rebond), sans-serif",
          fontWeight: 700,
          fontSize: 24,
          lineHeight: "32px",
          color: "white",
          marginBottom: 12,
          marginTop: 0,
          whiteSpace: "pre-line",
        }}
      >
        {"Detailed Backlink‑\nProfile Analysis"}
      </h3>
      <p
        style={{
          fontSize: 14,
          color: "rgb(155,150,176)",
          lineHeight: "24px",
          letterSpacing: "-0.14px",
          maxWidth: 280,
          marginBottom: 32,
          marginTop: 0,
        }}
      >
        Uncover backlink sources, anchor texts, and authority scores to optimize
        your strategy and boost SEO.
      </p>

      {/* Image area */}
      <div style={{ position: "relative", flex: 1 }}>
        {/* Main SVG background */}
        <Image
          src="/images/research/card-detailed-desktop.svg"
          alt="Detailed backlink profile analysis illustration"
          fill
          style={{ objectFit: "cover", borderRadius: 8 }}
        />
        {/* Light overlays */}
        <Image
          src="/images/research/card-detailed-light1.png"
          alt=""
          fill
          style={{
            objectFit: "cover",
            borderRadius: 8,
            mixBlendMode: "screen",
            opacity: 0.6,
          }}
        />
        <Image
          src="/images/research/card-detailed-light2.png"
          alt=""
          fill
          style={{
            objectFit: "cover",
            borderRadius: 8,
            mixBlendMode: "screen",
            opacity: 0.4,
          }}
        />
        {/* Floating icons */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            width: 64,
            height: 64,
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
          }}
        >
          <Image
            src="/images/research/card-detailed-icon1.png"
            alt=""
            width={64}
            height={64}
            style={{ borderRadius: 12 }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            top: 80,
            right: 24,
            width: 64,
            height: 64,
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
          }}
        >
          <Image
            src="/images/research/card-detailed-icon2.png"
            alt=""
            width={64}
            height={64}
            style={{ borderRadius: 12 }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            width: 64,
            height: 64,
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
          }}
        >
          <Image
            src="/images/research/card-detailed-icon3.png"
            alt=""
            width={64}
            height={64}
            style={{ borderRadius: 12 }}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card: Explore Shared SEO Keywords
// ---------------------------------------------------------------------------

function CardExploreKeywords() {
  return (
    <div
      style={{
        padding: 40,
        height: 544,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h3
        style={{
          fontFamily: "var(--font-rebond), sans-serif",
          fontWeight: 700,
          fontSize: 24,
          lineHeight: "32px",
          color: "white",
          marginBottom: 12,
          marginTop: 0,
        }}
      >
        Explore Shared SEO Keywords
      </h3>
      <p
        style={{
          fontSize: 14,
          color: "rgb(155,150,176)",
          lineHeight: "24px",
          letterSpacing: "-0.14px",
          maxWidth: 280,
          marginBottom: 32,
          marginTop: 0,
        }}
      >
        Rapidly pinpoint overlapping keywords between two websites for
        competitive SEO analysis and strategic keyword planning.
      </p>

      {/* Image area */}
      <div style={{ position: "relative", flex: 1 }}>
        <Image
          src="/images/research/card-explore-table2.svg"
          alt="Explore shared SEO keywords table"
          fill
          style={{ objectFit: "contain", borderRadius: 8 }}
        />
        <Image
          src="/images/research/card-explore-light1.png"
          alt=""
          fill
          style={{
            objectFit: "cover",
            borderRadius: 8,
            mixBlendMode: "screen",
            opacity: 0.5,
          }}
        />
        <Image
          src="/images/research/card-explore-light2.png"
          alt=""
          fill
          style={{
            objectFit: "cover",
            borderRadius: 8,
            mixBlendMode: "screen",
            opacity: 0.3,
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card: Research Track Table
// ---------------------------------------------------------------------------

function CardResearchTable() {
  return (
    <div
      style={{
        padding: "32px 40px",
        background: "rgba(0,0,0,0.2)",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginRight: 4 }}>
          🇺🇸 wope.com (US, en)
        </span>
        <PillButton>Filter</PillButton>
        <PillButton>Sort</PillButton>

        <div style={{ flex: 1 }} />

        <PillButton>Search</PillButton>
        <PillButton>View Options</PillButton>
      </div>

      {/* Result count */}
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 14, color: "white", fontWeight: 600 }}>
          12,345 Result
        </span>
      </div>

      {/* Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        <colgroup>
          <col style={{ width: "14%" }} />
          <col style={{ width: "9%" }} />
          <col style={{ width: "9%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "19%" }} />
        </colgroup>
        <thead>
          <tr>
            {[
              "Keyword",
              "Volume",
              "Trend",
              "Search Intent",
              "K.D.",
              "Position",
              "Visual Rank",
              "Change",
              "URL",
            ].map((h) => (
              <th
                key={h}
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.4)",
                  fontWeight: 500,
                  padding: "8px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  textAlign: "left",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TABLE_ROWS.map((row) => (
            <tr key={row.keyword}>
              <td
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  fontSize: 14,
                  color: "white",
                  fontWeight: 500,
                }}
              >
                {row.keyword}
              </td>
              <td
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  fontSize: 14,
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                {row.volume}
              </td>
              <td
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <TrendBar />
              </td>
              <td
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <IntentBadge intent={row.intent} />
              </td>
              <td
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <KdBadge value={row.kd} />
              </td>
              <td
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  fontSize: 14,
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                {row.position}
              </td>
              <td
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  fontSize: 14,
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                {row.visualRank}
              </td>
              <td
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <ChangeCell value={row.change} />
              </td>
              <td
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.45)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.url}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Table footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 12,
        }}
      >
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}>
          COUNT 100
        </span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
          1–101 of 2,345 &nbsp;&middot;&nbsp; PAGE 1 of 23
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function ResearchCardsSection() {
  return (
    <section
      style={{
        padding: "80px 0",
        maxWidth: 1248,
        margin: "0 auto",
      }}
    >
      {/* Section heading */}
      <h2
        style={{
          fontFamily: "var(--font-rebond), sans-serif",
          fontWeight: 700,
          fontSize: 56,
          lineHeight: "64px",
          color: "white",
          textAlign: "center",
          marginBottom: 48,
          marginTop: 0,
          whiteSpace: "pre-line",
        }}
      >
        {"Meet New-Gen\nResearch Experience"}
      </h2>

      {/* Cards grid */}
      <CardsContainer>
        {/* Top 2-column grid */}
        <div
          className={cn("cards-grid")}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <CardDetailedBacklink />
          <CardExploreKeywords />
        </div>

        {/* Bottom full-width table card */}
        <CardResearchTable />
      </CardsContainer>
    </section>
  );
}

export default ResearchCardsSection;
