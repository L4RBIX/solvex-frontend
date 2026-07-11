import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SignInGate from "@/components/auth/SignInGate";

describe("SignInGate", () => {
  it("keeps private features gated while signed out", () => {
    const onSignIn = vi.fn();
    render(<SignInGate onSignIn={onSignIn} title="Private progress" />);
    expect(screen.getByText("Private progress")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(onSignIn).toHaveBeenCalledOnce();
  });
});
