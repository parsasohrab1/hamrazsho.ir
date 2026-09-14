import { isValidDataKey, isValueWithinSizeLimit, MAX_VALUE_BYTES } from "@/services/userDataValidation";

describe("isValidDataKey", () => {
  it("accepts a typical client AsyncStorage-style key", () => {
    expect(isValidDataKey("mind_companion_mood_log_v1")).toBe(true);
  });

  it("rejects an empty key", () => {
    expect(isValidDataKey("")).toBe(false);
  });

  it("rejects keys with path-like or special characters", () => {
    expect(isValidDataKey("../etc/passwd")).toBe(false);
    expect(isValidDataKey("some key")).toBe(false);
    expect(isValidDataKey("some.key")).toBe(false);
  });

  it("rejects a key longer than 128 characters", () => {
    expect(isValidDataKey("a".repeat(129))).toBe(false);
    expect(isValidDataKey("a".repeat(128))).toBe(true);
  });
});

describe("isValueWithinSizeLimit", () => {
  it("accepts a small JSON value", () => {
    expect(isValueWithinSizeLimit({ mood: "ok", notes: "fine" })).toBe(true);
  });

  it("rejects a value whose JSON exceeds MAX_VALUE_BYTES", () => {
    const big = { blob: "x".repeat(MAX_VALUE_BYTES + 1) };
    expect(isValueWithinSizeLimit(big)).toBe(false);
  });
});
