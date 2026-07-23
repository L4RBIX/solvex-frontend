import { describe, expect, it } from "vitest";

import {
  arenaProblemHref,
  codeforcesProblemHref,
  normalizeProblemId,
  problemIdFromParts,
  soloArenaDraftKey,
} from "@/lib/problemRoutes";

describe("problem routes", () => {
  it("normalizes Codeforces identifiers safely", () => {
    expect(normalizeProblemId("71A")).toBe("71A");
    expect(normalizeProblemId("71a")).toBe("71A");
    expect(normalizeProblemId(" 71a ")).toBe("71A");
    expect(problemIdFromParts(1364, "b")).toBe("1364B");
  });

  it.each(["", "A71", "71/A", "-71A", "0A", "../../etc/passwd"])(
    "rejects malformed identifier %s",
    (problemId) => {
      expect(normalizeProblemId(problemId)).toBeNull();
    }
  );

  it("builds canonical internal and external problem routes", () => {
    expect(arenaProblemHref("71a", " Dan1c ")).toBe(
      "/arena?problem=71A&handle=Dan1c"
    );
    expect(codeforcesProblemHref("71a")).toBe(
      "https://codeforces.com/problemset/problem/71/A"
    );
  });

  it("keeps drafts separate by normalized problem and language", () => {
    expect(soloArenaDraftKey("71a", "cpp17")).toBe(
      "solvex:arena:draft:71A:cpp17"
    );
    expect(soloArenaDraftKey("4A", "cpp17")).not.toBe(
      soloArenaDraftKey("71A", "cpp17")
    );
    expect(soloArenaDraftKey("71A", "cpp17")).not.toBe(
      soloArenaDraftKey("71A", "python3")
    );
  });
});
