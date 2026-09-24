// @vitest-environment node
import { describe, expect, it } from "vitest";
import { strayCodeRedirect } from "./stray-code";

describe("strayCodeRedirect", () => {
  it("forwards a code on the home page to the confirm page", () => {
    const target = strayCodeRedirect(new URL("https://parlour.test/?code=abc"));
    expect(target?.pathname).toBe("/auth/confirm");
    expect(target?.searchParams.get("code")).toBe("abc");
    expect(target?.searchParams.get("next")).toBe("/");
  });

  it("returns to the page the code landed on, keeping its other parameters", () => {
    const target = strayCodeRedirect(new URL("https://parlour.test/queue?code=abc&view=list"));
    expect(target?.searchParams.get("next")).toBe("/queue?view=list");
  });

  it("leaves the confirm page and pages without a code alone", () => {
    expect(strayCodeRedirect(new URL("https://parlour.test/auth/confirm?code=abc"))).toBeNull();
    expect(strayCodeRedirect(new URL("https://parlour.test/search?q=zelda"))).toBeNull();
  });
});
