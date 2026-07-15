import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CTASection from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, prefetch: vi.fn(), replace: vi.fn() }),
}));

beforeEach(() => {
  pushMock.mockClear();
});

describe("Footer", () => {
  it("credits the founders and never mentions Kydyrbekov", () => {
    const { container } = render(<Footer />);
    expect(container.textContent).not.toContain("Kydyrbekov");
    expect(container.textContent).toContain("Kydyrbek Bekarys");
    expect(container.textContent).toContain("Shaimardan Yerbossyn");
    expect(container.textContent).toContain("Built by young founders");
  });

  it("links Privacy and Terms to real routes", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
  });
});

describe("Privacy and Terms pages", () => {
  it("renders the privacy page with honest data statements", () => {
    const { container } = render(<PrivacyPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Privacy" })).toBeInTheDocument();
    expect(container.textContent).toContain("never asks for, receives, or stores your Codeforces password");
    expect(container.textContent).toContain("not affiliated with");
  });

  it("renders the terms page", () => {
    render(<TermsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Terms" })).toBeInTheDocument();
  });
});

describe("Feature cards", () => {
  it("does not use glyph placeholder icons", () => {
    const { container } = render(<HowItWorksSection />);
    for (const glyph of ["◈", "◉", "◎", "◇"]) {
      expect(container.textContent).not.toContain(glyph);
    }
    // ◆ was also used as a card glyph; it must not appear as icon text either
    expect(container.textContent).not.toContain("◆");
    // lucide renders real SVG icons instead
    expect(container.querySelectorAll("svg.lucide").length).toBeGreaterThanOrEqual(6);
  });
});

describe("Hero handle form", () => {
  function submitForm(container: HTMLElement) {
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);
  }

  it("submits a trimmed handle to the analyze page", () => {
    const { container } = render(<HeroSection />);
    fireEvent.change(screen.getByLabelText("Codeforces handle"), {
      target: { value: "  tourist  " },
    });
    submitForm(container);
    expect(pushMock).toHaveBeenCalledWith("/analyze?handle=tourist");
  });

  it("shows a validation message for an empty handle", () => {
    const { container } = render(<HeroSection />);
    submitForm(container);
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a Codeforces handle");
  });

  it("CTA form mirrors the hero behavior: submits a handle, validates empty", () => {
    const { container } = render(<CTASection />);
    submitForm(container);
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a Codeforces handle");

    fireEvent.change(screen.getByLabelText("Codeforces handle"), {
      target: { value: " Benq " },
    });
    submitForm(container);
    expect(pushMock).toHaveBeenCalledWith("/analyze?handle=Benq");
  });
});
