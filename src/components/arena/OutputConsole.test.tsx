import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import OutputConsole from "@/components/arena/OutputConsole";

describe("duel infrastructure verdicts", () => {
  it("renders no_tests as not evaluated, never Wrong Answer", () => {
    render(
      <OutputConsole
        isRunning={false}
        events={[]}
        result={{
          status: "no_tests",
          is_mock: false,
          message: "Judging unavailable",
        }}
      />
    );
    expect(screen.getAllByText("Judging unavailable").length).toBeGreaterThan(0);
    expect(screen.getByText("This duel problem has no shared server-controlled tests.")).toBeInTheDocument();
    expect(screen.getByText("Your solution was not evaluated.")).toBeInTheDocument();
    expect(screen.queryByText("Wrong Answer")).not.toBeInTheDocument();
  });

  it("still renders a normal verified judge pass without crashing", () => {
    render(
      <OutputConsole
        isRunning={false}
        events={[]}
        result={{ status: "accepted", passed: true, is_mock: false, message: "Shared server tests passed." }}
      />
    );
    expect(screen.getByText("Accepted")).toBeInTheDocument();
    expect(screen.getByText("Shared server tests passed.")).toBeInTheDocument();
  });
});
