import { describe, expect, it } from "vitest";
import { verifiedEmailOrNull } from "@/lib/auth-linking";

describe("verifiedEmailOrNull", () => {
  it("returns the email when verified is true", () => {
    expect(verifiedEmailOrNull("person@example.com", true)).toBe("person@example.com");
  });

  it("returns null when verified is false, even with an email present (FR-004)", () => {
    expect(verifiedEmailOrNull("person@example.com", false)).toBeNull();
  });

  it("returns null when there is no email at all", () => {
    expect(verifiedEmailOrNull(null, true)).toBeNull();
    expect(verifiedEmailOrNull(undefined, true)).toBeNull();
  });

  it("returns null when verified is undefined", () => {
    expect(verifiedEmailOrNull("person@example.com", undefined)).toBeNull();
  });
});
