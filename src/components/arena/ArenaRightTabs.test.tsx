import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ArenaRightTabs from "@/components/arena/ArenaRightTabs";

describe("Arena PvP Copilot boundary", () => {
  it("does not render Copilot in duel mode", () => {
    render(<ArenaRightTabs active="tests" onSelect={vi.fn()} busy={false} duelMode />);
    expect(screen.getByRole("button", { name: "Tests" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Console" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copilot" })).not.toBeInTheDocument();
    expect(screen.getByText("Copilot is disabled during PvP to keep the duel fair.")).toBeInTheDocument();
  });

  it("keeps Copilot available in normal Arena", () => {
    const onSelect = vi.fn();
    render(<ArenaRightTabs active="tests" onSelect={onSelect} busy={false} duelMode={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Copilot" }));
    expect(onSelect).toHaveBeenCalledWith("copilot");
  });
});
