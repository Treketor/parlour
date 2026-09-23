// @vitest-environment node
import { describe, expect, it } from "vitest";
import { isActivePath } from "./nav";

describe("isActivePath", () => {
  it("matches the root only on the root", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/queue", "/")).toBe(false);
  });

  it("matches a section and its sub-pages", () => {
    expect(isActivePath("/queue", "/queue")).toBe(true);
    expect(isActivePath("/queue/reorder", "/queue")).toBe(true);
  });

  it("does not match a different route that shares a prefix", () => {
    expect(isActivePath("/queued", "/queue")).toBe(false);
    expect(isActivePath("/search-history", "/search")).toBe(false);
  });
});
