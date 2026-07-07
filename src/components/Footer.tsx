import Link from "next/link";
import { GitHubIcon } from "@/components/icons";

const productLinks = [
  { label: "Analyze",       href: "/#hero-input" },
  { label: "How it works",  href: "/#how-it-works" },
  { label: "Methodology",   href: "/#methodology" },
  { label: "Pricing",       href: "/#pricing" },
];

const legalLinks = [
  { label: "Privacy",   href: "/privacy" },
  { label: "Terms",     href: "/terms" },
  { label: "Contact",   href: "mailto:solvex@example.com" },
];

const communityLinks = [
  { label: "GitHub",      href: "https://github.com", external: true },
  { label: "Codeforces",  href: "https://codeforces.com", external: true },
  { label: "Feedback",    href: "mailto:solvex@example.com", external: false },
];

interface LinkColumnProps {
  heading: string;
  links: { label: string; href: string; external?: boolean }[];
}

function LinkColumn({ heading, links }: LinkColumnProps) {
  return (
    <div>
      <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(244,247,246,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "18px" }}>
        {heading}
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {links.map((link) => (
          <li key={link.href} style={{ marginBottom: "4px" }}>
            <a
              href={link.href}
              {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              style={{
                display: "block",
                fontSize: "14px",
                color: "rgba(244,247,246,0.5)",
                lineHeight: 2.1,
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              className="hover:!text-white"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer
      style={{
        background: "#020806",
        borderTop: "1px solid rgba(0,245,160,0.07)",
        color: "#F4F7F6",
        paddingTop: "72px",
      }}
    >
      {/* Main row */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "48px",
          maxWidth: "1248px",
          margin: "0 auto",
          padding: "0 48px 64px",
          flexWrap: "wrap",
        }}
      >
        {/* Brand column */}
        <div style={{ minWidth: "220px", maxWidth: "260px" }}>
          <Link
            href="/"
            style={{ display: "flex", alignItems: "center", textDecoration: "none", marginBottom: "16px" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/SolveX-logo-cropped.png"
              alt="SolveX"
              style={{ height: "36px", width: "auto", maxWidth: "150px", objectFit: "contain" }}
            />
          </Link>

          <p style={{ fontSize: "14px", color: "rgba(244,247,246,0.45)", lineHeight: "22px", marginBottom: "24px" }}>
            Performance intelligence for competitive programmers. Finds what to train. Not what looks impressive.
          </p>

          <Link
            href="/#hero-input"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 20px",
              borderRadius: "9999px",
              border: "1px solid rgba(0,245,160,0.28)",
              color: "#00F5A0",
              fontSize: "13.5px",
              fontWeight: 500,
              textDecoration: "none",
              transition: "background 0.2s",
              letterSpacing: "-0.01em",
            }}
          >
            Analyze profile →
          </Link>
        </div>

        {/* Link columns */}
        <nav
          aria-label="Footer navigation"
          style={{ display: "flex", flexDirection: "row", gap: "56px", flexWrap: "wrap" }}
        >
          <LinkColumn heading="Product"   links={productLinks} />
          <LinkColumn heading="Legal"     links={legalLinks} />
          <LinkColumn heading="Community" links={communityLinks} />
        </nav>

        {/* About card */}
        <div
          style={{
            background: "rgba(0,245,160,0.03)",
            border: "1px solid rgba(0,245,160,0.08)",
            borderRadius: "14px",
            padding: "24px",
            minWidth: "200px",
            maxWidth: "240px",
          }}
        >
          <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#F4F7F6", marginBottom: "10px" }}>
            Built by a competitive programmer
          </div>
          <p style={{ fontSize: "13px", color: "rgba(244,247,246,0.4)", lineHeight: "21px", marginBottom: "16px" }}>
            Bekarys Kydyrbekov · Kazakhstan<br />
            Codeforces: rated, frustrated, building.
          </p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12.5px",
              color: "rgba(244,247,246,0.4)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            className="hover:!text-white"
          >
            <GitHubIcon />
            Open source (coming soon)
          </a>
        </div>
      </div>

      {/* Divider */}
      <div style={{ maxWidth: "1248px", margin: "0 auto", padding: "0 48px" }}>
        <div style={{ height: "1px", background: "rgba(0,245,160,0.06)" }} />
      </div>

      {/* Bottom bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "1248px",
          margin: "0 auto",
          padding: "20px 48px 36px",
          fontSize: "12.5px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <span style={{ color: "rgba(244,247,246,0.28)" }}>©2026 SolveX. Free during beta.</span>
        <span style={{ color: "rgba(244,247,246,0.28)" }}>Uses Codeforces public API · No private data stored</span>
      </div>
    </footer>
  );
}
