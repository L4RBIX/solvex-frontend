import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/supabaseClient";

describe("safeNextPath", () => {
  it("allows same-origin relative paths", () => {
    expect(safeNextPath("/duels?invite=abc")).toBe("/duels?invite=abc");
  });

  it.each(["https://evil.example", "//evil.example/path", "\\evil.example", "javascript:alert(1)"])(
    "rejects an unsafe redirect: %s",
    (value) => expect(safeNextPath(value)).toBe("/analyze")
  );
});
