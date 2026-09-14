import bcrypt from "bcryptjs";

/** Generates a random 6-digit numeric code as a string (e.g. "042917"),
 *  zero-padded so it's always 6 characters. */
export const generateOtpCode = (): string => String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");

export const hashOtpCode = async (code: string): Promise<string> => bcrypt.hash(code, 10);

export const verifyOtpCode = async (code: string, hash: string): Promise<boolean> => bcrypt.compare(code, hash);

export const otpExpiryDate = (ttlMinutes: number, now: Date = new Date()): Date =>
  new Date(now.getTime() + ttlMinutes * 60_000);

export const isOtpExpired = (expiresAt: Date, now: Date = new Date()): boolean => now.getTime() > expiresAt.getTime();

/** Normalizes a phone number to a consistent E.164-ish form for storage
 *  and matching: strips whitespace/dashes, converts a leading "0" (the
 *  common Iranian mobile format, e.g. 0912...) to "+98", and requires a
 *  "+" prefix otherwise. Returns null if the input doesn't look like a
 *  phone number at all. */
export const normalizePhone = (raw: string): string | null => {
  const cleaned = raw.replace(/[\s\-()]/g, "");
  if (/^0\d{10}$/.test(cleaned)) return `+98${cleaned.slice(1)}`;
  if (/^\+\d{8,15}$/.test(cleaned)) return cleaned;
  return null;
};
