import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import TestCasePanel from "@/components/arena/TestCasePanel";
import type { TestCase } from "@/types/arena";

const publicSample: TestCase = {
  id: "sample-1",
  input: "4\nword\n",
  expected_output: "word\n",
  status: "not_run",
  is_sample: true,
  label: "Public sample 1",
};

function renderPanel(localOnly: boolean) {
  const onUpdate = vi.fn();
  render(
    <TestCasePanel
      testCases={[publicSample]}
      onRun={vi.fn()}
      onRunAll={vi.fn()}
      onAdd={vi.fn()}
      onDelete={vi.fn()}
      onUpdate={onUpdate}
      isRunning={false}
      runningId={null}
      localOnly={localOnly}
    />
  );
  fireEvent.click(screen.getByText("Public sample 1"));
  return { onUpdate };
}

describe("TestCasePanel local tests", () => {
  it("treats public samples as editable local copies in solo mode", () => {
    const { onUpdate } = renderPanel(true);
    const input = screen.getAllByRole("textbox")[0];

    expect(input).not.toHaveAttribute("readonly");
    fireEvent.change(input, { target: { value: "5\nhello\n" } });
    expect(onUpdate).toHaveBeenCalledWith("sample-1", "input", "5\nhello\n");
    expect(
      screen.getByText(/not official Codeforces judging/i)
    ).toBeInTheDocument();
  });

  it("keeps trusted duel samples read-only", () => {
    renderPanel(false);

    expect(screen.getAllByRole("textbox")[0]).toHaveAttribute("readonly");
    expect(
      screen.queryByText(/not official Codeforces judging/i)
    ).not.toBeInTheDocument();
  });
});
