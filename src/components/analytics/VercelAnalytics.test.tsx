import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import RootLayout from "@/app/layout";
import {
  sanitizeAnalyticsEvent,
  VercelAnalytics,
} from "@/components/analytics/VercelAnalytics";

const analyticsRender = vi.hoisted(() => vi.fn());

vi.mock("@vercel/analytics/next", () => ({
  Analytics: (props: unknown) => {
    analyticsRender(props);
    return <span data-vercel-analytics="true" />;
  },
}));

vi.mock("next/font/local", () => ({
  default: () => ({ variable: "--font-test" }),
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => (
    <div data-auth-provider="true">{children}</div>
  ),
}));

describe("VercelAnalytics", () => {
  it("passes a single Analytics component through the root layout", () => {
    analyticsRender.mockClear();

    const markup = renderToStaticMarkup(
      <RootLayout>
        <main>SolveX application</main>
      </RootLayout>
    );

    expect(analyticsRender).toHaveBeenCalledTimes(1);
    expect(markup.match(/data-vercel-analytics="true"/g)).toHaveLength(1);
    expect(markup).toContain('data-auth-provider="true"');
    expect(markup).toContain("SolveX application");
  });

  it("mounts the official Analytics component", () => {
    analyticsRender.mockClear();
    render(<VercelAnalytics />);
    expect(analyticsRender).toHaveBeenCalledWith(
      expect.objectContaining({ beforeSend: sanitizeAnalyticsEvent })
    );
  });

  it("removes query parameters and hash fragments", () => {
    const sanitized = sanitizeAnalyticsEvent({
      type: "pageview",
      url: "https://solvex.example/analyze?handle=Dan1c#results",
    });

    expect(sanitized).toEqual({
      type: "pageview",
      url: "https://solvex.example/analyze",
    });
  });

  it("preserves the route while removing all Arena identifiers", () => {
    const sanitized = sanitizeAnalyticsEvent({
      type: "pageview",
      url: "https://solvex.example/arena?contestId=4&index=A&handle=Dan1c",
    });

    expect(sanitized?.url).toBe("https://solvex.example/arena");
  });

  it("drops events with invalid URLs safely", () => {
    expect(
      sanitizeAnalyticsEvent({ type: "pageview", url: "not a valid URL" })
    ).toBeNull();
  });
});
