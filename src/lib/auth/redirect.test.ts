// @vitest-environment node
import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./redirect";

describe("safeRedirectPath", () => {
  it("keeps same-site paths with their query and hash", () => {
    expect(safeRedirectPath("/queue")).toBe("/queue");
    expect(safeRedirectPath("/search?q=hades#results")).toBe("/search?q=hades#results");
  });

  it("falls back when there is nothing to use", () => {
    expect(safeRedirectPath(null)).toBe("/");
    expect(safeRedirectPath(undefined)).toBe("/");
    expect(safeRedirectPath("")).toBe("/");
  });

  it.each([
    ["an absolute URL", "https://evil.example/steal"],
    ["a protocol-relative URL", "//evil.example"],
    ["a backslash variant", "/\\evil.example"],
    ["a tab-smuggled variant", "/\t/evil.example"],
    ["a relative path", "queue"],
    ["a javascript URL", "javascript:alert(1)"],
  ])("rejects %s", (_, value) => {
    expect(safeRedirectPath(value)).toBe("/");
  });

  it("uses the given fallback", () => {
    expect(safeRedirectPath("//evil.example", "/sign-in")).toBe("/sign-in");
  });
});
