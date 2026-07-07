"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Product", href: "/#product" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Methodology", href: "/#methodology" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <header className={`tx-navbar ${scrolled ? "tx-navbar-scrolled" : ""}`}>
        <div className="tx-navbar-inner">
          {/* Logo */}
          <Link
            href="/"
            style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/SolveX-logo-cropped.png"
              alt="SolveX"
              style={{ height: "44px", width: "auto", maxWidth: "180px", objectFit: "contain" }}
            />
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Main navigation" className="tx-desktop-nav">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="tx-nav-link">
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="tx-desktop-nav">
            <Link href="/#hero-input" className="tx-nav-cta">
              Analyze profile
            </Link>
          </div>

          {/* Mobile burger */}
          <button
            className="tx-mobile-burger"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              {mobileOpen ? (
                <>
                  <line x1="4" y1="4" x2="18" y2="18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  <line x1="18" y1="4" x2="4" y2="18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <line x1="3" y1="7"  x2="19" y2="7"  stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  <line x1="3" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  <line x1="3" y1="17" x2="19" y2="17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <nav className={`tx-mobile-menu ${mobileOpen ? "open" : ""}`} aria-label="Mobile navigation">
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href} className="tx-mobile-nav-link" onClick={() => setMobileOpen(false)}>
            {link.label}
          </a>
        ))}
        <Link
          href="/#hero-input"
          style={{
            marginTop: "16px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            fontWeight: 700,
            color: "#020806",
            background: "#00F5A0",
            borderRadius: "9999px",
            padding: "12px 24px",
            textDecoration: "none",
          }}
          onClick={() => setMobileOpen(false)}
        >
          Analyze profile
        </Link>
      </nav>
    </>
  );
}
