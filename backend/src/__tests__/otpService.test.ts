import {
  generateOtpCode,
  hashOtpCode,
  isOtpExpired,
  normalizePhone,
  otpExpiryDate,
  verifyOtpCode,
} from "@/services/otpService";

describe("generateOtpCode", () => {
  it("always returns a 6-digit zero-padded numeric string", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateOtpCode();
      expect(code).toMatch(/^\d{6}$/);
    }
  });
});

describe("hashOtpCode / verifyOtpCode", () => {
  it("verifies the correct code against its hash", async () => {
    const hash = await hashOtpCode("123456");
    await expect(verifyOtpCode("123456", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect code", async () => {
    const hash = await hashOtpCode("123456");
    await expect(verifyOtpCode("654321", hash)).resolves.toBe(false);
  });

  it("never stores the plaintext code in the hash", async () => {
    const hash = await hashOtpCode("111111");
    expect(hash).not.toContain("111111");
  });
});

describe("otpExpiryDate / isOtpExpired", () => {
  it("computes an expiry N minutes in the future", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const expiry = otpExpiryDate(5, now);
    expect(expiry.getTime() - now.getTime()).toBe(5 * 60_000);
  });

  it("treats a past expiry as expired", () => {
    const now = new Date("2026-01-01T00:10:00Z");
    const expiry = new Date("2026-01-01T00:00:00Z");
    expect(isOtpExpired(expiry, now)).toBe(true);
  });

  it("treats a future expiry as not expired", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const expiry = new Date("2026-01-01T00:10:00Z");
    expect(isOtpExpired(expiry, now)).toBe(false);
  });
});

describe("normalizePhone", () => {
  it("converts a leading-zero Iranian mobile number to +98 form", () => {
    expect(normalizePhone("09121234567")).toBe("+989121234567");
  });

  it("strips whitespace and dashes before normalizing", () => {
    expect(normalizePhone("0912 123-4567")).toBe("+989121234567");
  });

  it("accepts an already-international number as-is", () => {
    expect(normalizePhone("+989121234567")).toBe("+989121234567");
  });

  it("rejects an invalid number", () => {
    expect(normalizePhone("not-a-phone")).toBeNull();
    expect(normalizePhone("123")).toBeNull();
  });
});
