// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parseEmailOtpType } from "./otp";

describe("parseEmailOtpType", () => {
  it("accepts the types Supabase puts in emailed links", () => {
    expect(parseEmailOtpType("email")).toBe("email");
    expect(parseEmailOtpType("magiclink")).toBe("magiclink");
  });

  it("rejects anything else", () => {
    expect(parseEmailOtpType("sms")).toBeNull();
    expect(parseEmailOtpType("")).toBeNull();
    expect(parseEmailOtpType(null)).toBeNull();
  });
});
