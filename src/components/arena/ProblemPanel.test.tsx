import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ProblemPanel from "@/components/arena/ProblemPanel";
import type { ArenaProblem } from "@/types/arena";

const authoredProblem: ArenaProblem = {
  key: "71A",
  contest_id: 71,
  index: "A",
  name: "Way Too Long Words",
  rating: 800,
  tags: ["strings", "implementation"],
  statement: "Shorten every word longer than ten characters.",
  input_format: "Read n followed by n words.",
  output_format: "Print each transformed word.",
  constraints: "1 <= n <= 100.",
  sample_tests: [{ input: "1\nlocalization\n", output: "l10n\n" }],
  is_sample: false,
  official_url: "https://codeforces.com/problemset/problem/71/A",
  content_available: true,
};

describe("ProblemPanel public content", () => {
  it("renders catalog metadata and clearly labels authored content", () => {
    render(<ProblemPanel problem={authoredProblem} />);

    expect(screen.getByText("71A")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Way Too Long Words" })).toBeInTheDocument();
    expect(screen.getByText("strings")).toBeInTheDocument();
    expect(screen.getByText("SolveX-authored practice summary")).toBeInTheDocument();
    expect(screen.getByText(authoredProblem.statement)).toBeInTheDocument();
    expect(screen.getByText(authoredProblem.input_format)).toBeInTheDocument();
    expect(screen.getByText(authoredProblem.output_format)).toBeInTheDocument();
    expect(screen.getByText(authoredProblem.constraints!)).toBeInTheDocument();
    expect(screen.getByText("localization", { exact: false })).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /Open official statement/i })
    ).toHaveAttribute(
      "href",
      "https://codeforces.com/problemset/problem/71/A"
    );
  });

  it("keeps catalog-only problems inside Arena with honest fallback copy", () => {
    render(
      <ProblemPanel
        problem={{
          ...authoredProblem,
          key: "1364B",
          name: "Most socially-distanced subsequence",
          rating: 1300,
          statement: "",
          input_format: "",
          output_format: "",
          constraints: undefined,
          sample_tests: [],
          content_available: false,
          official_url: "https://codeforces.com/problemset/problem/1364/B",
        }}
      />
    );

    expect(
      screen.getByText(
        /does not currently store a SolveX-authored practice summary or the official Codeforces statement/i
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("SolveX-authored practice summary")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Open official statement/i })
    ).toHaveAttribute(
      "href",
      "https://codeforces.com/problemset/problem/1364/B"
    );
  });
});
