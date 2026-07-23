import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicProblemResponse } from "@/lib/v1Api";

const mocks = vi.hoisted(() => ({
  query: "",
  getPublicProblem: vi.fn(),
  runCode: vi.fn(),
  openDuelArena: vi.fn(),
  authStatus: "signed_out",
  duelState: null as Record<string, unknown> | null,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(mocks.query),
}));

vi.mock("@/lib/v1Api", () => {
  class V1ApiError extends Error {
    status: number;
    errorCode: string;

    constructor(status: number, errorCode: string, message: string) {
      super(message);
      this.status = status;
      this.errorCode = errorCode;
    }
  }

  return {
    V1ApiError,
    getPublicProblem: mocks.getPublicProblem,
    openDuelArena: mocks.openDuelArena,
    requestDuelHint: vi.fn(),
    submitDuel: vi.fn(),
  };
});

vi.mock("@/lib/executionApi", () => ({
  runCode: mocks.runCode,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    status: mocks.authStatus,
    user:
      mocks.authStatus === "signed_in"
        ? { user_id: "user-1", handle: "Dan1c" }
        : null,
    busy: false,
    error: null,
    signIn: vi.fn(),
  }),
}));

vi.mock("@/hooks/useDuelState", () => ({
  useDuelState: () => ({
    state: mocks.duelState,
    fatalError: null,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/components/arena/ArenaHeader", () => ({
  default: (props: {
    problemKey: string;
    problemName: string;
    onRun: () => void;
    onSubmit: () => void;
    duelMode: boolean;
    officialUrl?: string | null;
  }) => (
    <header>
      <span>{props.problemKey}</span>
      <span>{props.problemName}</span>
      <button type="button" onClick={props.onRun}>
        {props.duelMode ? "Run" : "Run local tests"}
      </button>
      {props.duelMode ? (
        <button type="button" onClick={props.onSubmit}>
          Submit
        </button>
      ) : props.officialUrl ? (
        <a href={props.officialUrl}>Open on Codeforces</a>
      ) : null}
    </header>
  ),
}));

vi.mock("@/components/arena/CodeEditor", () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <textarea
      aria-label="Code editor"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

vi.mock("@/components/arena/TestCasePanel", () => ({
  default: (props: {
    testCases: Array<{
      id: string;
      label: string;
      input: string;
      expected_output: string;
    }>;
    onRun: (id: string) => void;
    localOnly: boolean;
  }) => (
    <section>
      <span>{props.localOnly ? "Local tests" : "Duel tests"}</span>
      {props.testCases.map((test) => (
        <div key={test.id}>
          <span>{test.label}</span>
          <span>{test.input}</span>
          <span>{test.expected_output}</span>
        </div>
      ))}
      {props.testCases[0] && (
        <button
          type="button"
          onClick={() => props.onRun(props.testCases[0].id)}
        >
          Run first test
        </button>
      )}
    </section>
  ),
}));

vi.mock("@/components/arena/OutputConsole", () => ({
  default: ({
    result,
    localOnly,
  }: {
    result: { status?: string; message?: string } | null;
    localOnly: boolean;
  }) => (
    <div>
      {localOnly ? "Local run output" : "Duel output"}
      {result?.status === "accepted" ? "Run completed" : result?.status}
      {result?.message}
    </div>
  ),
}));

vi.mock("@/components/arena/ArenaRightTabs", () => ({
  default: ({
    onSelect,
  }: {
    onSelect: (tab: "tests" | "console" | "copilot") => void;
  }) => (
    <nav>
      <button type="button" onClick={() => onSelect("tests")}>
        Tests
      </button>
      <button type="button" onClick={() => onSelect("console")}>
        Console
      </button>
    </nav>
  ),
}));

vi.mock("@/components/arena/CopilotPanel", () => ({
  default: () => <div>Copilot panel</div>,
}));

vi.mock("@/components/arena/DuelPanel", () => ({
  DuelStatusBar: () => <div>Trusted duel state</div>,
  DuelResultOverlay: () => null,
}));

vi.mock("@/components/auth/SignInGate", () => ({
  default: () => <div>Sign in to duel</div>,
}));

import ArenaLayout from "@/components/arena/ArenaLayout";
import { V1ApiError } from "@/lib/v1Api";

function problem(
  problemId: string,
  options: { authored?: boolean; name?: string } = {}
): PublicProblemResponse {
  const match = /^(\d+)(.+)$/.exec(problemId);
  if (!match) throw new Error("Test problem ID is invalid.");
  const authored = options.authored ?? true;
  return {
    problem_id: problemId,
    contest_id: Number(match[1]),
    index: match[2],
    name: options.name ?? `Problem ${problemId}`,
    rating: problemId === "71A" ? 800 : 1300,
    tags: ["strings", "implementation"],
    official_url: `https://codeforces.com/problemset/problem/${match[1]}/${match[2]}`,
    content_available: authored,
    authored_content: authored
      ? {
          summary: `SolveX summary for ${problemId}`,
          input_format: `Input format for ${problemId}`,
          output_format: `Output format for ${problemId}`,
          constraints: `Constraints for ${problemId}`,
          samples: [
            {
              input: `${problemId} sample input`,
              output: `${problemId} sample output`,
              note: null,
            },
          ],
        }
      : null,
  };
}

describe("Solo Arena problem loading", () => {
  beforeEach(() => {
    mocks.query = "";
    mocks.authStatus = "signed_out";
    mocks.duelState = null;
    mocks.getPublicProblem.mockReset();
    mocks.runCode.mockReset();
    mocks.openDuelArena.mockReset();
    localStorage.clear();
  });

  it("preserves the existing sample problem for plain /arena", () => {
    render(<ArenaLayout />);

    expect(screen.getAllByText("Removals Game").length).toBeGreaterThan(0);
    expect(screen.getByText("Sample training problem")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run local tests" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit" })).not.toBeInTheDocument();
    expect(mocks.getPublicProblem).not.toHaveBeenCalled();
  });

  it.each([
    ["problem=71A", "71A"],
    ["problem=71a", "71A"],
    ["problem=%2071a%20", "71A"],
  ])("normalizes %s and loads the requested metadata", async (query, expectedId) => {
    mocks.query = query;
    mocks.getPublicProblem.mockResolvedValue(problem(expectedId));

    render(<ArenaLayout />);

    expect(
      await screen.findByRole("heading", { name: `Problem ${expectedId}` })
    ).toBeInTheDocument();
    expect(mocks.getPublicProblem).toHaveBeenCalledWith(expectedId);
    expect(screen.queryByText("Removals Game")).not.toBeInTheDocument();
  });

  it("never flashes the fixed sample while requested metadata is loading", () => {
    mocks.query = "problem=71A";
    mocks.getPublicProblem.mockReturnValue(new Promise(() => {}));

    render(<ArenaLayout />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading problem");
    expect(screen.getByText("SolveX Arena · 71A")).toBeInTheDocument();
    expect(screen.queryByText("Removals Game")).not.toBeInTheDocument();
  });

  it("shows a clean malformed URL state without calling the API", () => {
    mocks.query = "problem=malformed-value";
    render(<ArenaLayout />);

    expect(screen.getByRole("alert")).toHaveTextContent("Invalid problem link");
    expect(screen.queryByText("Removals Game")).not.toBeInTheDocument();
    expect(mocks.getPublicProblem).not.toHaveBeenCalled();
  });

  it("shows not-found without replacing the request with the sample", async () => {
    mocks.query = "problem=9999Z";
    mocks.getPublicProblem.mockRejectedValue(
      new V1ApiError(404, "PROBLEM_NOT_FOUND", "Not found")
    );
    render(<ArenaLayout />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Problem not found"
    );
    expect(screen.queryByText("Removals Game")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Open official statement/i })
    ).toHaveAttribute(
      "href",
      "https://codeforces.com/problemset/problem/9999/Z"
    );
  });

  it.each([
    [new V1ApiError(0, "NETWORK_ERROR", "offline"), "Problem catalog unavailable"],
    [
      new V1ApiError(502, "INVALID_RESPONSE", "invalid"),
      "Problem metadata unavailable",
    ],
  ])("renders actionable API failures", async (error, message) => {
    mocks.query = "problem=71A";
    mocks.getPublicProblem.mockRejectedValue(error);
    render(<ArenaLayout />);

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.queryByText("Removals Game")).not.toBeInTheDocument();
  });

  it("renders authored metadata, formats, constraints, samples, and official URL", async () => {
    mocks.query = "problem=71A";
    mocks.getPublicProblem.mockResolvedValue(
      problem("71A", { name: "Way Too Long Words" })
    );
    render(<ArenaLayout />);

    expect(
      await screen.findByRole("heading", { name: "Way Too Long Words" })
    ).toBeInTheDocument();
    expect(screen.getByText("SolveX summary for 71A")).toBeInTheDocument();
    expect(screen.getByText("Input format for 71A")).toBeInTheDocument();
    expect(screen.getByText("Output format for 71A")).toBeInTheDocument();
    expect(screen.getByText("Constraints for 71A")).toBeInTheDocument();
    expect(screen.getAllByText("71A sample input").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: /Open official statement/i })
    ).toHaveAttribute(
      "href",
      "https://codeforces.com/problemset/problem/71/A"
    );
  });

  it("keeps catalog-only problems in Arena with editor and honest fallback", async () => {
    mocks.query = "problem=1364B";
    mocks.getPublicProblem.mockResolvedValue(
      problem("1364B", {
        authored: false,
        name: "Most socially-distanced subsequence",
      })
    );
    render(<ArenaLayout />);

    expect(
      await screen.findByRole("heading", {
        name: "Most socially-distanced subsequence",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not currently store a SolveX-authored practice summary/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Code editor")).toBeInTheDocument();
    expect(screen.getByText("Local tests")).toBeInTheDocument();
    expect(screen.queryByText("Accepted")).not.toBeInTheDocument();
    expect(screen.queryByText("official Codeforces acceptance")).not.toBeInTheDocument();
  });

  it("restores and switches normalized problem drafts without collisions", async () => {
    localStorage.setItem(
      "solvex:arena:draft:71A:cpp17",
      "// draft for 71A"
    );
    localStorage.setItem(
      "solvex:arena:draft:4A:cpp17",
      "// draft for 4A"
    );
    mocks.query = "problem=71A";
    mocks.getPublicProblem.mockImplementation(async (id: string) => problem(id));

    const view = render(<ArenaLayout />);
    await screen.findByRole("heading", { name: "Problem 71A" });
    await waitFor(() => {
      expect(screen.getByLabelText("Code editor")).toHaveValue("// draft for 71A");
    });

    mocks.query = "problem=4A";
    view.rerender(<ArenaLayout />);
    await screen.findByRole("heading", { name: "Problem 4A" });
    await waitFor(() => {
      expect(screen.getByLabelText("Code editor")).toHaveValue("// draft for 4A");
    });
    expect(
      screen.queryByRole("heading", { name: "Problem 71A" })
    ).not.toBeInTheDocument();
  });

  it("runs only the selected editable/public local test", async () => {
    mocks.query = "problem=71A";
    mocks.getPublicProblem.mockResolvedValue(problem("71A"));
    mocks.runCode.mockResolvedValue({
      status: "accepted",
      stdout: "71A sample output",
      stderr: "",
      is_mock: false,
    });
    render(<ArenaLayout />);

    await screen.findByRole("heading", { name: "Problem 71A" });
    fireEvent.click(screen.getByRole("button", { name: "Run local tests" }));

    await waitFor(() => {
      expect(mocks.runCode).toHaveBeenCalledWith(
        expect.objectContaining({
          stdin: "71A sample input",
          expected_output: "71A sample output",
          problem_key: "71A",
        })
      );
    });
    expect(await screen.findByText(/Run completed/)).toBeInTheDocument();
  });
});

describe("Arena duel trust boundary", () => {
  beforeEach(() => {
    mocks.query = "duel=duel-1&problem=71A";
    mocks.authStatus = "signed_in";
    mocks.getPublicProblem.mockReset();
    mocks.openDuelArena.mockResolvedValue({});
    mocks.duelState = {
      duel_id: "duel-1",
      status: "active",
      judging_available: true,
      judging_note: "Practice judging only.",
      problem: {
        problem_id: "4A",
        name: "Watermelon",
        rating: 800,
        tags: ["math"],
        statement_summary: "Trusted server-provided summary.",
        input_format: "One integer.",
        output_format: "YES or NO.",
        constraints: "1 <= w <= 100.",
        sample_tests: [{ input: "8\n", output: "YES\n" }],
        content_complete: true,
        content_notice: "SolveX-authored practice summary.",
        url: "https://codeforces.com/problemset/problem/4/A",
      },
      shared_test: {
        input: "HIDDEN_DUEL_INPUT",
        expected_output: "HIDDEN_DUEL_EXPECTED_OUTPUT",
      },
      participants: [],
      result: null,
    };
  });

  it("ignores solo URL overrides and renders only trusted duel problem data", async () => {
    render(<ArenaLayout />);

    expect(screen.getAllByText("Watermelon").length).toBeGreaterThan(0);
    expect(screen.getByText("Trusted server-provided summary.")).toBeInTheDocument();
    expect(screen.queryByText("Problem 71A")).not.toBeInTheDocument();
    expect(mocks.getPublicProblem).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("HIDDEN_DUEL_INPUT");
    expect(document.body.textContent).not.toContain(
      "HIDDEN_DUEL_EXPECTED_OUTPUT"
    );
  });
});
