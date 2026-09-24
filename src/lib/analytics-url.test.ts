// @vitest-environment node
import { describe, expect, it } from "vitest";
import { redactUrl } from "./analytics-url";

describe("redactUrl", () => {
  it("drops sign-in codes and tokens", () => {
    expect(
      redactUrl("https://parlour.test/auth/confirm?token_hash=abc&type=magiclink&next=%2F"),
    ).toBe("https://parlour.test/auth/confirm");
    expect(redactUrl("https://parlour.test/?code=abc")).toBe("https://parlour.test/");
  });

  it("drops entry ids but keeps how the page was viewed", () => {
    expect(redactUrl("https://parlour.test/?view=list&entry=8e13e13c&sort=title")).toBe(
      "https://parlour.test/?view=list&sort=title",
    );
  });

  it("keeps search terms and drops fragments", () => {
    expect(redactUrl("https://parlour.test/search?q=zelda#results")).toBe(
      "https://parlour.test/search?q=zelda",
    );
  });
});
