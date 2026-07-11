import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    status: "signed_in",
    recoverySession: false,
    updatePassword: vi.fn(),
  }),
}));

import { ResetPasswordClient } from "@/components/auth/ResetPasswordClient";

describe("ResetPasswordClient", () => {
  it("rejects an authenticated session that did not come from password recovery", () => {
    render(<ResetPasswordClient />);
    expect(screen.getByText("Invalid recovery session")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Update password" })).not.toBeInTheDocument();
  });
});
