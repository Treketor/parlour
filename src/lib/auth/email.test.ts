// @vitest-environment node
import { describe, expect, it } from "vitest";
import { checkEmail } from "./email";

describe("checkEmail", () => {
  it("accepts an address, trimmed and lower-cased", () => {
    expect(checkEmail("  Player@Example.com ")).toEqual({ ok: true, email: "player@example.com" });
  });

  it("asks for an address when the field is empty", () => {
    expect(checkEmail("   ")).toEqual({ ok: false, message: "Enter your email address." });
    expect(checkEmail(null)).toMatchObject({ ok: false });
  });

  it.each(["player.example.com", "player@example", "play er@example.com", "@example.com"])(
    "rejects %s",
    (value) => {
      expect(checkEmail(value)).toMatchObject({ ok: false });
    },
  );
});
