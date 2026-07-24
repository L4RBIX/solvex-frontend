import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ArenaHeader from "@/components/arena/ArenaHeader";

describe("ArenaHeader duel submit availability", () => {
  it("disables Submit with a clear infrastructure reason when duel tests are unavailable", () => {
    const onSubmit = vi.fn();
    render(
      <ArenaHeader
        problemKey="4A"
        problemName="Watermelon"
        language="python3"
        onLanguageChange={vi.fn()}
        onRun={vi.fn()}
        onSubmit={onSubmit}
        onReset={vi.fn()}
        onCopy={vi.fn()}
        isRunning={false}
        isSubmitting={false}
        savedAt={null}
        snapshotCount={0}
        submitDisabled
        submitDisabledReason="Judging unavailable: this duel has no shared server-controlled tests."
      />
    );
    const submit = screen.getByRole("button", { name: "Submit" });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute("title", expect.stringContaining("Judging unavailable"));
    fireEvent.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("uses local-run language and an official external action in solo mode", () => {
    render(
      <ArenaHeader
        problemKey="71A"
        problemName="Way Too Long Words"
        language="cpp17"
        onLanguageChange={vi.fn()}
        onRun={vi.fn()}
        onSubmit={vi.fn()}
        onReset={vi.fn()}
        onCopy={vi.fn()}
        isRunning={false}
        isSubmitting={false}
        duelMode={false}
        officialUrl="https://codeforces.com/problemset/problem/71/A"
        savedAt={null}
        snapshotCount={0}
      />
    );

    expect(
      screen.getByRole("button", { name: "Run local tests" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Submit" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Open on Codeforces/i })
    ).toHaveAttribute(
      "href",
      "https://codeforces.com/problemset/problem/71/A"
    );
  });
});
